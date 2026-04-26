import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useState } from "react";
import Form from "../components/Form";
import PortfolioTable from "../components/PortfolioTable";
import TopCoins from "../components/TopCoins";
import CoinGeckoAttribution from "../components/CoinGeckoAttribution";
import { useCurrency } from "../context/CurrencyContext";
import useCoins from "../hooks/useCoins";
import useChart from "../hooks/useChart";
import PieChartComponent from "../components/PieChartComponent";
import BarChartComponent from "../components/BarChartComponent";
import { motion } from "motion/react";

const Dashboard = ({
	watchlist,
	toggleWatchlist,
	portfolio,
	form,
	addCoin,
	toggleForm,
	coinData,
	removeCoin,
}) => {
	const portfolioCoins = Object.keys(portfolio);
	const [action, setAction] = useState("");
	const { currency, formatCurrency } = useCurrency();
	const { coins, loading, error } = useCoins(portfolio);
	const chart = useChart(portfolio, coins);

	const handleToggleForm = (coin, actionType) => {
		setAction(actionType);
		toggleForm(coin);
	};

	const totalInvestment = Object.keys(portfolio).reduce((acc, coinId) => {
		return acc + portfolio[coinId].totalInvestment;
	}, 0);

	const currentValue = Object.keys(portfolio).reduce((acc, coinId) => {
		const coinData = coins.find((c) => c.id === coinId);
		if (coinData && portfolio[coinId]) {
			return acc + portfolio[coinId].coins * coinData.current_price;
		}
		return acc;
	}, 0);

	const profit =
		((currentValue - totalInvestment) / totalInvestment) * 100 || 0;

	const containerVariants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1
			}
		}
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		show: { y: 0, opacity: 1 }
	};

	return !form ? (
		<motion.div 
			variants={containerVariants}
			initial="hidden"
			animate="show"
			className="bg-slate-50 min-h-screen w-full p-4 sm:p-6 lg:p-8 dark:bg-[#020617] dark:text-white transition-colors duration-300"
		>
			<div className="max-w-7xl mx-auto">
				<motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<div className="glass-card rounded-3xl p-8 flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 group">
						<h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
							Current Value
						</h2>
						<p className="text-4xl sm:text-5xl font-black premium-gradient-text tracking-tighter">
							{formatCurrency(currentValue * currency[1])}
						</p>
						<div
							className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
								profit < 0 
									? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" 
									: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
							}`}
						>
							{profit < 0 ? <TrendingDownIcon fontSize="small" /> : <TrendingUpIcon fontSize="small" />}
							<span>{profit.toFixed(2)}%</span>
						</div>
					</div>
					<div className="glass-card rounded-3xl p-8 flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
						<h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
							Total Investment
						</h2>
						<p className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
							{formatCurrency(totalInvestment * currency[1])}
						</p>
						<div className="h-7" /> {/* Spacer for symmetry */}
					</div>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
					<motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-3xl p-8">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-xl font-bold text-slate-800 dark:text-white">
								Portfolio Allocation
							</h2>
						</div>
						<div className="w-full h-80">
							{loading ? (
								<div className="flex justify-center items-center h-full text-slate-400">
									<motion.div 
										animate={{ rotate: 360 }}
										transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
										className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
									/>
								</div>
							) : error ? (
								<div className="flex justify-center items-center h-full text-rose-500 font-medium">
									<p>{error}</p>
								</div>
							) : chart.length > 0 ? (
								<PieChartComponent chart={chart} />
							) : (
								<div className="flex justify-center items-center h-full text-slate-400">
									<p>No coins in portfolio to display.</p>
								</div>
							)}
						</div>
					</motion.div>
					
					<motion.div variants={itemVariants} className="glass-card rounded-3xl overflow-hidden">
						<TopCoins
							coins={coins}
							loading={loading}
							error={error}
							portfolio={portfolio}
						/>
					</motion.div>
				</div>

				<motion.div variants={itemVariants} className="glass-card rounded-3xl p-8 mb-8">
					<h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
						Investment Performance
					</h2>
					<div className="w-full h-96">
						{loading ? (
							<div className="flex justify-center items-center h-full text-slate-400">
								<p>Analyzing performance...</p>
							</div>
						) : error ? (
							<div className="flex justify-center items-center h-full text-rose-500 font-medium">
								<p>{error}</p>
							</div>
						) : chart.length > 0 ? (
							<BarChartComponent chart={chart} />
						) : (
							<div className="flex justify-center items-center h-full text-slate-400">
								<p>No data to display in chart.</p>
							</div>
						)}
					</div>
				</motion.div>

				<motion.div variants={itemVariants} className="glass-card rounded-3xl overflow-hidden mb-12">
					<PortfolioTable
						loading={loading}
						error={error}
						coins={coins}
						toggleWatchlist={toggleWatchlist}
						watchlist={watchlist}
						portfolio={portfolio}
						message={
							portfolioCoins.length !== 0
								? ""
								: "No Coins Added To Portfolio"
						}
						toggleForm={handleToggleForm}
						totalInvestment={totalInvestment}
						currentValue={currentValue}
					/>
				</motion.div>

				<motion.div variants={itemVariants} className="text-center pb-8">
					<CoinGeckoAttribution />
				</motion.div>
			</div>
		</motion.div>
	) : (
		<Form
			title={
				action == "add" ? "Add to Portfolio" : "Remove from Portfolio"
			}
			buttonText={action == "add" ? "Add" : "Remove"}
			coinData={coinData}
			toggleForm={toggleForm}
			action={action == "add" ? addCoin : removeCoin}
			portfolio={portfolio}
		/>
	);
};

export default Dashboard;
