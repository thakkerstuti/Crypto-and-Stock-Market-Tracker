import { useState } from "react";
import Table from "../components/Table";
import Form from "../components/Form";
import LoginWarning from "../components/LoginWarning";
import CoinGeckoAttribution from "../components/CoinGeckoAttribution";
import { useAuth } from "../context/AuthContext";
import useTopCoins from "../hooks/useTopCoins";
import Searchbar from "../components/Searchbar";
import { motion } from "motion/react";

const Home = ({
	watchlist,
	toggleWatchlist,
	addCoin,
	form,
	toggleForm,
	coinData,
}) => {
	const { isAuthenticated } = useAuth();
	const { coins, loading, error } = useTopCoins();
	const [search, setSearch] = useState("");

	const filteredCoins = coins.filter(
		(coin) =>
			coin.name.toLowerCase().includes(search.toLowerCase()) ||
			coin.symbol.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<motion.div 
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="min-h-screen pb-24"
		>
			{!form ? (
				<div className="p-4 font-sans max-w-7xl mx-auto">
					<div className="w-full text-center flex flex-col items-center mt-12 sm:mt-20 mb-16 gap-6">
						<motion.div
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							<h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-4">
								<span className="premium-gradient-text">Track Crypto</span>
								<br />
								<span className="text-slate-900 dark:text-white">With Precision</span>
							</h1>
							<p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
								The most advanced real-time cryptocurrency tracking platform. 
								Manage your portfolio and stay ahead of the market.
							</p>
						</motion.div>

						<motion.div
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.4 }}
							className="w-full max-w-2xl mt-4"
						>
							<Searchbar
								searchValue={search}
								setSearchValue={setSearch}
								placeholder="Search 10,000+ cryptocurrencies..."
							/>
						</motion.div>
						
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6 }}
						>
							<CoinGeckoAttribution />
						</motion.div>
					</div>

					<motion.div 
						initial={{ y: 40, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.6, duration: 0.5 }}
						className="w-full glass-card rounded-3xl overflow-hidden mb-12"
					>
						<Table
							loading={loading}
							error={error}
							coins={filteredCoins}
							toggleWatchlist={toggleWatchlist}
							watchlist={watchlist}
							message={""}
							toggleForm={toggleForm}
						/>
					</motion.div>
				</div>
			) : isAuthenticated ? (
				<Form
					title={"Add to Portfolio"}
					buttonText={"Add"}
					coinData={coinData}
					toggleForm={toggleForm}
					action={addCoin}
				/>
			) : (
				<LoginWarning toggleForm={toggleForm} />
			)}
		</motion.div>
	);
};

export default Home;
