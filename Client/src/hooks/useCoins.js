import { useState, useEffect } from "react";

// Cache object to store coin data and timestamps
const coinCache = {
	data: {},
	timestamp: 0,
};

const CACHE_DURATION = 60 * 1000; // 60 seconds

export default function useCoins(portfolio) {
	const portfolioCoins = Object.keys(portfolio).sort(); // Sort to keep key consistent
	const [coins, setCoins] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const searchCoins = async () => {
			setLoading(true);
			setError(null);

			if (portfolioCoins.length === 0) {
				setCoins([]);
				setLoading(false);
				return;
			}

			const coinIds = portfolioCoins.join(",");
			const cacheKey = coinIds;

			// Check if cache is still valid
			if (
				coinCache.data[cacheKey] &&
				Date.now() - coinCache.timestamp < CACHE_DURATION
			) {
				setCoins(coinCache.data[cacheKey]);
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(
					`http://localhost:3000/api/coins?ids=${coinIds}`
				);

				if (res.status === 429) {
					throw new Error(
						"Rate limit exceeded. Please wait a moment before adding more coins."
					);
				}

				if (!res.ok) throw new Error("An error occured while fetching data");

				const data = await res.json();
				
				// Update cache
				coinCache.data[cacheKey] = data;
				coinCache.timestamp = Date.now();
				
				setCoins(data);
			} catch (err) {
				console.error("Error fetching coins:", err);
				setError(err.message === "Failed to fetch" ? "Network error or API rate limit. Please try again in a minute." : err.message);
			} finally {
				setLoading(false);
			}
		};

		searchCoins();
	}, [JSON.stringify(portfolioCoins)]); // Use stringified sorted keys for stable dependency

	return { coins, loading, error };
}
