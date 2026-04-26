import { useEffect, useState } from "react";
import api from "../services/api";

export default function useWatchlist(watchlist) {
	const [coins, setCoins] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const searchCoins = async () => {
			setLoading(true);
			setError(null);

			if (watchlist.length === 0) {
				setCoins([]);
				setLoading(false);
				return;
			}

			try {
				const coinIds = watchlist.join(",");
				const response = await api.get(`/coins`, {
					params: { ids: coinIds }
				});
				if (Array.isArray(response.data)) {
					setCoins(response.data);
				} else {
					throw new Error("Invalid watchlist data received");
				}
			} catch (err) {
				console.error("Error fetching watchlist coins:", err);
				if (err.code === 'ERR_NETWORK') {
					setError("Network error. Please check your server.");
				} else {
					setError(err.response?.data?.error || "Failed to fetch watchlist data");
				}
			} finally {
				setLoading(false);
			}
		};

		searchCoins();
	}, [watchlist]);

	return {
		coins,
		loading,
		error,
	};
}
