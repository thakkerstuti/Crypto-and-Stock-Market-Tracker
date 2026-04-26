require("dotenv").config();
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

// Backend Cache for CoinGecko Proxy
const coinCache = new Map();
const currencyCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

app.get("/api/currency", async (req, res) => {
	const cacheKey = "latest-usd";
	const cachedData = currencyCache.get(cacheKey);

	if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
		return res.json(cachedData.data);
	}

	try {
		const url = "https://api.frankfurter.app/latest?from=USD";
		console.log(`Fetching from Frankfurter: ${url}`);
		const response = await fetch(url);

		if (!response.ok) throw new Error("Frankfurter API error");

		const data = await response.json();
		currencyCache.set(cacheKey, {
			data,
			timestamp: Date.now(),
		});

		return res.json(data);
	} catch (err) {
		console.error("Currency Proxy Error:", err);
		if (cachedData) return res.json(cachedData.data);
		return res.status(500).json({ error: "Failed to fetch currency data" });
	}
});

app.get("/api/coins", async (req, res) => {
	const { ids, vs_currency = "usd" } = req.query;
	const cacheKey = `${ids}-${vs_currency}`;
	
	const cachedData = coinCache.get(cacheKey);
	if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
		return res.json(cachedData.data);
	}

	try {
		let url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&sparkline=false`;
		if (ids) {
			url += `&ids=${ids}`;
		} else {
			url += `&per_page=100&page=1`;
		}

		console.log(`Fetching from CoinGecko: ${url}`);
		const response = await fetch(url);
		
		if (response.status === 429) {
			console.warn("CoinGecko Rate Limit Hit!");
			// If backend is also rate limited, serve stale cache if available
			if (cachedData) {
				console.log("Serving stale cache due to rate limit");
				return res.json(cachedData.data);
			}
			console.log("Serving mock data due to rate limit");
			return res.json(mockData);
		}

		if (!response.ok) throw new Error("CoinGecko API error");

		const data = await response.json();
		
		// Update cache
		coinCache.set(cacheKey, {
			data,
			timestamp: Date.now()
		});

		return res.json(data);
	} catch (err) {
		console.error("Proxy Error:", err);
		if (cachedData) return res.json(cachedData.data);
		console.log("Serving mock data due to proxy error");
		return res.json(mockData);
	}
});

app.get("/api", (req, res) => {
	return res.send("API is running");
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

const startServer = async () => {
	try {
		await connectDB();
		app.listen(PORT, "0.0.0.0", () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (err) {
		console.error("Failed to start server:", err.message);
	}
};

startServer();
