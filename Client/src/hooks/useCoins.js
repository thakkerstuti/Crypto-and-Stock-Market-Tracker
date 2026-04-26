import { useState, useEffect } from "react";
import api from "../services/api";

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
				const response = await api.get(`/coins`, {
					params: { ids: coinIds }
				});

				const data = response.data;
				
				if (Array.isArray(data)) {
					// Update cache
					coinCache.data[cacheKey] = data;
					coinCache.timestamp = Date.now();
					setCoins(data);
				} else {
					throw new Error("Invalid data format received");
				}
			} catch (err) {
				console.error("Error fetching coins:", err);
				
				if (err.response?.status === 429) {
					setError("Rate limit exceeded. Please wait a moment before adding more coins.");
				} else if (err.code === 'ERR_NETWORK') {
					setError("Network error. Please check your internet connection or server status.");
				} else {
					setError(err.response?.data?.error || "Failed to fetch coin data");
				}
			} finally {
				setLoading(false);
			}
		};

		searchCoins();
	}, [JSON.stringify(portfolioCoins)]); // Use stringified sorted keys for stable dependency

	return { coins, loading, error };
}
