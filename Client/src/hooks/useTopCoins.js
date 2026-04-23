import { useState, useEffect } from "react";
import { COINGECKO_TOP_COINS_API } from "../constants";

// Cache object to store top coins data and timestamps
const topCoinsCache = {
	data: [],
	timestamp: 0,
};

const CACHE_DURATION = 60 * 1000; // 60 seconds

export default function useTopCoins() {
	const [coins, setCoins] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const topCoins = async () => {
			setLoading(true);
			setError(null);

			// Check if cache is still valid
			if (
				topCoinsCache.data.length > 0 &&
				Date.now() - topCoinsCache.timestamp < CACHE_DURATION
			) {
				setCoins(topCoinsCache.data);
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(COINGECKO_TOP_COINS_API);
				
				if (response.status === 429) {
					throw new Error(
						"Rate limit exceeded. Please wait a moment."
					);
				}

				if (!response.ok) {
					throw new Error("An error occured while fetching top coins");
				}

				const data = await response.json();
				
				// Update cache
				topCoinsCache.data = data;
				topCoinsCache.timestamp = Date.now();
				
				setCoins(data);
			} catch (err) {
				console.error("Error fetching top coins:", err);
				setError(err.message === "Failed to fetch" ? "Network error or API rate limit. Please try again in a minute." : err.message);
			} finally {
				setLoading(false);
			}
		};

		topCoins();
	}, []);

	return { coins, loading, error };
}
