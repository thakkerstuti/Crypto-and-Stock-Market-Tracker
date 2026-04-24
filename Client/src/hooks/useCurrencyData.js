import { useState, useEffect } from "react";
import api from "../services/api";

export default function useCurrencyData() {
	const [currencyData, setCurrencyData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		async function getCurrency() {
			try {
				setLoading(true);
				setError(null);
				const res = await api.get("/api/currency");
				setCurrencyData(res.data);
			} catch (err) {
				setError(err.response?.data?.error || "Failed to fetch currency");
			} finally {
				setLoading(false);
			}
		}

		getCurrency();
	}, []);

	return {
		currencyData,
		loading,
		error,
	};
}
