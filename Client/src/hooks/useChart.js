import { useState, useEffect } from "react";

export default function useChart(portfolio, coins) {
	const portfolioCoins = Object.keys(portfolio);
	const [chart, setChart] = useState([]);

	useEffect(() => {
		if (Array.isArray(coins) && coins.length > 0 && portfolioCoins.length > 0) {
			const dataForChart = coins
				.map((coin) => {
					if (!coin) return null;
					const portfolioCoin = portfolio[coin.id];
					if (!portfolioCoin) return null;
					return {
						name: coin.name || "Unknown",
						value: (portfolioCoin.coins || 0) * (coin.current_price || 0),
						total: portfolioCoin.totalInvestment || 0,
					};
				})
				.filter(Boolean);
			setChart(dataForChart);
		} else {
			setChart([]);
		}
	}, [coins, portfolio]);

	return chart;
}
