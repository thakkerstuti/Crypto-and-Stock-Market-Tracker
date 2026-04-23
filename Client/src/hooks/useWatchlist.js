import { useEffect, useState } from "react";

export default function useWatchlist(watchlist) {
	const [coins, setCoins] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const searchCoins = async (query) => {
			setLoading(true);
			setError(null);

			if (watchlist.length === 0) {
				setCoins([]);
				setLoading(false);
				return;
			}

			try {
				const coinIds = watchlist.join(",");
				const res = await fetch(
					`http://localhost:3000/api/coins?ids=${coinIds}`
				);
				if (!res.ok) throw new Error("An error occured");
				const data = await res.json();
				setCoins(data);
			} catch (err) {
				setError(err.message);
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
