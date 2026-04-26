import { useState, useEffect } from "react";
import api from "../services/api";

export default function useTopCoins() {
	const [coins, setCoins] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const topCoins = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await api.get("/coins");
				setCoins(response.data);
			} catch (err) {
				console.error("Error fetching top coins:", err);
				setError(err.response?.data?.error || "Failed to fetch coin data");
			} finally {
				setLoading(false);
			}
		};

		topCoins();
	}, []);

	return { coins, loading, error };
}
