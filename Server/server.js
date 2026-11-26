require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const jwt = require("jsonwebtoken");
const User = require("./models/Users");
const mockData = require("./mockData.json");
const PORT = process.env.PORT || 3000;
const app = express();

app.use(
	cors({
		origin: [
			process.env.CLIENT,
			"http://localhost:5173",
			"http://localhost:5174",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:5174",
			"https://cryptotrack-ultimez.vercel.app",
		].filter(Boolean),
		credentials: true,
	})
);

app.use(express.json());
const passport = require("./auth");
app.use(passport.initialize());

// ---------------------------------------------------------------------------
// Market data proxy (CoinGecko) — rate-limit friendly
//
// Instead of one upstream call per unique `ids` combination (which burned
// through CoinGecko's free-tier limit quickly), we fetch the top 250 coins once
// and answer every request (Home, Dashboard, Watchlist, AI chat) from that
// shared snapshot. Concurrent requests share a single in-flight fetch, a 429
// triggers a cool-down, and the last good snapshot is persisted to disk so a
// rate limit or outage still serves real (slightly stale) prices.
// ---------------------------------------------------------------------------
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const MARKET_TTL = 2 * 60 * 1000; // refresh at most every 2 minutes
const RATE_LIMIT_COOLDOWN = 60 * 1000; // back off for 60s after a 429
const CACHE_DIR = path.join(__dirname, ".cache");
const MARKET_SNAPSHOT = path.join(CACHE_DIR, "market.json");
const CURRENCY_SNAPSHOT = path.join(CACHE_DIR, "currency.json");

const readSnapshot = (file) => {
	try {
		return JSON.parse(fs.readFileSync(file, "utf8"));
	} catch {
		return null;
	}
};

const writeSnapshot = (file, value) => {
	try {
		fs.mkdirSync(CACHE_DIR, { recursive: true });
		fs.writeFileSync(file, JSON.stringify(value));
	} catch (err) {
		console.warn("Could not persist cache snapshot:", err.message);
	}
};

// Start from the last persisted snapshot (timestamp 0 => refresh on first use)
let market = { data: readSnapshot(MARKET_SNAPSHOT)?.data || mockData, timestamp: 0 };
let marketInFlight = null;
const extraCoins = new Map(); // coins outside the top 250: id -> { data, timestamp }
let rateLimitedUntil = 0;

async function coingecko(pathAndQuery) {
	if (Date.now() < rateLimitedUntil) {
		throw new Error("CoinGecko cool-down active (recent rate limit)");
	}
	const headers = { accept: "application/json" };
	if (process.env.COINGECKO_API_KEY) {
		headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
	}
	const response = await fetch(`${COINGECKO_BASE}${pathAndQuery}`, { headers });
	if (response.status === 429) {
		rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN;
		throw new Error("CoinGecko rate limit hit (429)");
	}
	if (!response.ok) throw new Error(`CoinGecko responded ${response.status}`);
	return response.json();
}

async function getMarket() {
	if (Date.now() - market.timestamp < MARKET_TTL) return market.data;

	if (!marketInFlight) {
		marketInFlight = coingecko(
			"/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false"
		)
			.then((data) => {
				if (!Array.isArray(data) || data.length === 0) throw new Error("Empty market data");
				market = { data, timestamp: Date.now() };
				writeSnapshot(MARKET_SNAPSHOT, market);
			})
			.catch((err) => {
				console.warn(`Market refresh failed, serving cached data: ${err.message}`);
			})
			.finally(() => {
				marketInFlight = null;
			});
	}
	await marketInFlight;
	return market.data;
}

async function getCoinsByIds(ids) {
	const data = await getMarket();
	const byId = new Map(data.map((c) => [c.id, c]));

	// Coins outside the top 250 are fetched (once per TTL) in a single call
	const missing = ids.filter(
		(id) =>
			!byId.has(id) &&
			!(extraCoins.has(id) && Date.now() - extraCoins.get(id).timestamp < MARKET_TTL)
	);
	if (missing.length > 0) {
		try {
			const fetched = await coingecko(
				`/coins/markets?vs_currency=usd&ids=${encodeURIComponent(missing.join(","))}&sparkline=false`
			);
			for (const coin of fetched) {
				extraCoins.set(coin.id, { data: coin, timestamp: Date.now() });
			}
		} catch (err) {
			console.warn(`Fetching extra coins failed, using cached data: ${err.message}`);
		}
	}

	return ids
		.map((id) => byId.get(id) || extraCoins.get(id)?.data)
		.filter(Boolean)
		.sort((a, b) => (a.market_cap_rank ?? Infinity) - (b.market_cap_rank ?? Infinity));
}

app.get("/api/coins", async (req, res) => {
	try {
		const ids = [
			...new Set(
				String(req.query.ids || "")
					.split(",")
					.map((id) => id.trim().toLowerCase())
					.filter(Boolean)
			),
		];

		if (ids.length > 0) {
			return res.json(await getCoinsByIds(ids));
		}
		const data = await getMarket();
		return res.json(data.slice(0, 100));
	} catch (err) {
		console.error("Coins proxy error:", err);
		return res.json(market.data.slice(0, 100));
	}
});

// Currency rates (Frankfurter moved from api.frankfurter.app to api.frankfurter.dev/v1)
const CURRENCY_TTL = 60 * 60 * 1000; // ECB rates update once a day
let currency = readSnapshot(CURRENCY_SNAPSHOT) || { data: null, timestamp: 0 };
currency.timestamp = 0;

app.get("/api/currency", async (req, res) => {
	if (currency.data && Date.now() - currency.timestamp < CURRENCY_TTL) {
		return res.json(currency.data);
	}

	try {
		const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD");
		if (!response.ok) throw new Error(`Frankfurter responded ${response.status}`);
		const data = await response.json();
		currency = { data, timestamp: Date.now() };
		writeSnapshot(CURRENCY_SNAPSHOT, currency);
		return res.json(data);
	} catch (err) {
		console.warn(`Currency refresh failed: ${err.message}`);
		// Fall back to last known rates, or USD-only so the UI keeps working
		return res.json(currency.data || { base: "USD", rates: {} });
	}
});

// Database-backed routes need a live MongoDB connection; fail fast with a clear message
const requireDB = (req, res, next) => {
	if (mongoose.connection.readyState === 1) return next();
	const message =
		"Database is not connected. Check MONGODB_URI in Server/.env and that MongoDB is running.";
	return res.status(503).json({ error: message, Error: message });
};
app.use(
	["/api/register", "/api/login", "/api/watchlist", "/api/portfolio"],
	requireDB
);

app.get("/api", (req, res) => {
	return res.send("API is running");
});

app.post("/api/chat", async (req, res) => {
	const { message, history = [], context = {} } = req.body;

	if (!message) {
		return res.status(400).json({ error: "Message is required" });
	}

	const apiKey = process.env.GEMINI_API_KEY;

	if (!apiKey || apiKey.trim() === "") {
		// Fallback/Warning mode for empty API Key
		return res.json({
			warning: true,
			text: "⚠️ **Gemini API Key is missing!**\n\nTo enable the active AI Assistant and get real-time portfolio analysis, please follow these simple steps:\n1. Visit **[Google AI Studio](https://aistudio.google.com/)** and create a **free** Gemini API key.\n2. Open `Server/.env` and paste your key: `GEMINI_API_KEY=your_key_here`.\n3. Restart the server.\n\n*In the meantime, here's a simulated assistant response based on your query:* \n\n\"It looks like you asked about **" + message + "**. I'd love to help you track and analyze this crypto with precision! Please configure my API key in the backend environment file to unlock my full analysis capabilities.\""
		});
	}

	try {
		// Construct system instruction with live data context
		const { portfolio = {} } = context;
		// All prices from the proxy are in USD, so label them as USD regardless of the UI currency
		const currency = "usd";
		// Use the server's shared market cache (no extra API calls) and include held coins
		// that may sit outside the top list, so P/L is never computed against a price of 0.
		const topCoins = await getMarket().catch(() => market.data);
		const heldCoins = await getCoinsByIds(Object.keys(portfolio || {})).catch(() => []);
		const coins = [...topCoins, ...heldCoins.filter((h) => !topCoins.some((c) => c.id === h.id))];

		let systemInstruction = "You are CryptoTrack AI, a professional and highly intelligent cryptocurrency analyst and financial advisor. " +
			"You help users manage and understand their cryptocurrency portfolios, track real-time market data, learn blockchain concepts, and analyze trends. " +
			"Keep your answers engaging, clear, and professional. Use markdown formatting (like bold, bullet points, numbered lists, tables, and spacing) to make your messages look extremely premium and easy to read. " +
			"Always be concise and direct. Do not give generic introductory or concluding remarks. Focus on giving high-value insights. \n\n";

		// Inject live top coins context if available
		if (coins && coins.length > 0) {
			systemInstruction += `CURRENT LIVE MARKET DATA (Top Coins in ${currency.toUpperCase()}):\n`;
			coins.slice(0, 15).forEach(coin => {
				systemInstruction += `- **${coin.name} (${coin.symbol.toUpperCase()})**: Price: ${currency.toLowerCase() === "usd" ? "$" : ""}${coin.current_price?.toLocaleString()} | 24h Change: ${coin.price_change_percentage_24h?.toFixed(2)}% | Market Cap Rank: #${coin.market_cap_rank}\n`;
			});
			systemInstruction += "\n";
		}

		// Inject portfolio context if available
		if (portfolio && Object.keys(portfolio).length > 0) {
			systemInstruction += "USER'S PORTFOLIO HOLDINGS:\n";
			for (const [coinId, data] of Object.entries(portfolio)) {
				// Match against live coin details if available in coin list
				const liveCoin = coins.find(c => c.id === coinId);
				const currentPrice = liveCoin ? liveCoin.current_price : 0;
				const currentVal = currentPrice * data.coins;
				const profitLoss = currentVal - data.totalInvestment;
				const profitLossPct = data.totalInvestment > 0 ? (profitLoss / data.totalInvestment) * 100 : 0;

				systemInstruction += `- **${coinId.toUpperCase()}**: Coins owned: ${data.coins} | Total Invested: ${currency.toLowerCase() === "usd" ? "$" : ""}${data.totalInvestment?.toLocaleString()} | Current Value: ${currency.toLowerCase() === "usd" ? "$" : ""}${currentVal?.toLocaleString()} | Profit/Loss: ${profitLoss >= 0 ? "+" : ""}${currency.toLowerCase() === "usd" ? "$" : ""}${profitLoss?.toLocaleString()} (${profitLossPct >= 0 ? "+" : ""}${profitLossPct?.toFixed(2)}%)\n`;
			}
			systemInstruction += "\n";
		} else {
			systemInstruction += "The user has an empty portfolio currently or is not logged in. Encourage them to sign up, log in, or add coins to their portfolio to get customized, real-time portfolio analysis and suggestions!\n\n";
		}

		// Convert history to Gemini API format
		// Gemini format expects: {"role": "user" | "model", "parts": [{"text": "..."}]}
		const contents = [];
		
		// Add history
		history.forEach(msg => {
			contents.push({
				role: msg.sender === "user" ? "user" : "model",
				parts: [{ text: msg.text }]
			});
		});

		// Add current message
		contents.push({
			role: "user",
			parts: [{ text: message }]
		});

		// Make request to Gemini API
		// gemini-1.5-flash has been retired; model is configurable via GEMINI_MODEL
		const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
		const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
		
		const response = await fetch(geminiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				contents,
				systemInstruction: {
					parts: [{ text: systemInstruction }]
				},
				generationConfig: {
					temperature: 0.7,
					maxOutputTokens: 1000
				}
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Gemini API Error details:", errorText);
			throw new Error(`Gemini API responded with status ${response.status}`);
		}

		const data = await response.json();
		const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!textResponse) {
			throw new Error("No response content from Gemini API");
		}

		return res.json({ text: textResponse });
	} catch (err) {
		console.error("LLM Chat Route Error:", err);
		return res.status(500).json({ error: "Failed to communicate with AI Assistant. Please check server logs." });
	}
});


app.post("/api/register", async (req, res) => {
	const { username, password } = req.body;
	console.log(`📝 Registration attempt for username: ${username}`);
	try {
		const user = await User.findOne({ username });
		if (user) {
			console.warn(`⚠️ Registration failed: User ${username} already exists`);
			return res.status(400).json({ Error: "User Already Exists" });
		}

		const newUser = new User({ username, password });
		await newUser.save();
		console.log(`✅ User ${username} registered successfully`);
		return res
			.status(200)
			.json({ message: "User Registered Successfully" });
	} catch (err) {
		console.error(`❌ Registration error for ${username}:`, err.message);
		return res.status(500).json({ Error: err.message });
	}
});

app.post("/api/login", (req, res, next) => {
	passport.authenticate("local", { session: false }, (err, user, info) => {
		if (err) {
			return res.status(500).json({ error: "Authentication error" });
		}
		if (!user) {
			return res.status(400).json({ error: "Invalid credentials" });
		}

		const payload = { id: user._id, username: user.username };
		const token = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: "24h",
		});

		res.status(200).json({
			message: "Login successful",
			token: token,
			user: {
				id: user._id,
				username: user.username,
			},
		});
	})(req, res, next);
});

app.get(
	"/api/watchlist",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const userId = req.user._id;
			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).json({ Error: "User not Found" });
			}

			return res.json({ watchlist: user.watchlist });
		} catch (err) {
			return res.status(500).json({ Error: err.message });
		}
	}
);

app.get(
	"/api/portfolio",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const userId = req.user._id;
			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).json({ Error: "User not Found" });
			}

			return res.json(user.portfolio);
		} catch (err) {
			return res.status(500).json({ Error: err.message });
		}
	}
);

app.put(
	"/api/watchlist/add",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const userId = req.user._id;
		const coin = req.body.coin;
		try {
			const user = await User.findByIdAndUpdate(
				userId,
				{ $addToSet: { watchlist: coin } },
				{ new: true }
			);

			if (!user) {
				return res.status(404).json({ Error: "User not Found" });
			}

			return res.status(200).json({ watchlist: user.watchlist });
		} catch (err) {
			return res.status(500).json({ Error: err.message });
		}
	}
);

app.put(
	"/api/watchlist/remove",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const userId = req.user._id;
		const coin = req.body.coin;
		try {
			const user = await User.findByIdAndUpdate(
				userId,
				{ $pull: { watchlist: coin } },
				{ new: true }
			);

			if (!user) {
				return res.status(404).json({ Error: "User not Found" });
			}

			return res.status(200).json({ watchlist: user.watchlist });
		} catch (err) {
			return res.status(500).json({ Error: err.message });
		}
	}
);

app.put(
	"/api/portfolio/update",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const userId = req.user._id;
		const { coin, coinData } = req.body;

		try {
			if (
				!coin ||
				!coinData ||
				typeof coinData.totalInvestment !== "number" ||
				typeof coinData.coins !== "number"
			) {
				return res.status(400).json({ error: "Invalid input data" });
			}

			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}

			const portfolio = user.portfolio;
			const existingCoinData = portfolio.get(coin);

			if (existingCoinData) {
				const newCoins = existingCoinData.coins + coinData.coins;

				if (coinData.coins < 0) {
					const sellAmount = Math.abs(coinData.coins);
					const ownedCoins = existingCoinData.coins;

					if (sellAmount > ownedCoins) {
						return res.status(400).json({
							error: `Cannot sell ${sellAmount} coins. You only own ${ownedCoins} coins.`,
						});
					}
				}

				if (newCoins <= 0) {
					portfolio.delete(coin);
				} else {
					let newTotalInvestment;

					if (coinData.coins < 0) {
						const remainingRatio =
							newCoins / existingCoinData.coins;
						newTotalInvestment =
							existingCoinData.totalInvestment * remainingRatio;
					} else {
						newTotalInvestment =
							existingCoinData.totalInvestment +
							coinData.totalInvestment;
					}

					existingCoinData.totalInvestment = newTotalInvestment;
					existingCoinData.coins = newCoins;
					portfolio.set(coin, existingCoinData);
				}
			} else {
				if (coinData.totalInvestment > 0 && coinData.coins > 0) {
					portfolio.set(coin, coinData);
				} else if (coinData.coins < 0) {
					return res.status(400).json({
						error: "Cannot sell coins that are not in your portfolio",
					});
				}
			}

			user.markModified("portfolio");

			const updatedUser = await user.save();
			return res.status(200).json(updatedUser.portfolio);
		} catch (err) {
			return res.status(500).json({ Error: err.message });
		}
	}
);

// Start the HTTP server immediately so market data, currency and AI chat work
// even if MongoDB is unavailable; keep retrying the DB connection in the background.
const DB_RETRY_MS = 15 * 1000;

const connectWithRetry = async () => {
	try {
		await connectDB();
	} catch (err) {
		console.error(
			`MongoDB unavailable (${err.message}). Login/portfolio/watchlist return 503 until it connects. Retrying in ${DB_RETRY_MS / 1000}s...`
		);
		setTimeout(connectWithRetry, DB_RETRY_MS);
	}
};

app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server is running on port ${PORT}`);
	getMarket(); // warm the market cache
});
connectWithRetry();
