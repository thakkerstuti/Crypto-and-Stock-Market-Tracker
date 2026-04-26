import { NavLink } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import CurrencySelector from "./CurrencySelector";
import { useAuth } from "../context/AuthContext";
import BrightnessMediumIcon from "@mui/icons-material/BrightnessMedium";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import useTheme from "../hooks/useTheme";
import { motion } from "motion/react";

const Header = ({ menu, toggleMenu, handleLogout }) => {
	const { isAuthenticated } = useAuth();
	const { theme, setTheme } = useTheme();

	return (
		<motion.div 
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			className="glass-header h-[72px] flex justify-between items-center px-6 select-none transition-all duration-300"
		>
			<NavLink
				to="/"
				className="text-2xl font-extrabold tracking-tight premium-gradient-text hover:scale-[1.05] transition-transform duration-300 flex items-center gap-2"
			>
				<motion.div
					animate={{ rotate: [0, 360] }}
					transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
					className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/20"
				/>
				CryptoTrack
			</NavLink>
			
			<ul className="hidden sm:flex items-center gap-2">
				<NavLink
					to="/"
					className={({ isActive }) =>
						`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
							isActive
								? "bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 shadow-sm"
								: "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
						}`
					}
				>
					Home
				</NavLink>
				
				{isAuthenticated ? (
					<>
						<NavLink
							to="dashboard"
							className={({ isActive }) =>
								`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
									isActive
										? "bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 shadow-sm"
										: "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
								}`
							}
						>
							Dashboard
						</NavLink>
						<NavLink
							to="watchlist"
							className={({ isActive }) =>
								`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
									isActive
										? "bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 shadow-sm"
										: "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
								}`
							}
						>
							Watchlist
						</NavLink>

						<div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

						<CurrencySelector />

						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleLogout}
							className="premium-button ml-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 rounded-xl shadow-lg shadow-rose-500/20"
						>
							Logout
						</motion.button>
					</>
				) : (
					<>
						<NavLink
							to="login"
							className={({ isActive }) =>
								`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
									isActive
										? "bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
										: "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
								}`
							}
						>
							Login
						</NavLink>
						<div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
						<CurrencySelector />
						<NavLink
							to="signup"
							className="premium-button ml-2 px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25"
						>
							Sign Up
						</NavLink>
					</>
				)}

				<motion.div
					whileHover={{ rotate: 15, scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
					className="ml-2 flex justify-center items-center w-10 h-10 rounded-xl cursor-pointer bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-all duration-200"
					onClick={() => setTheme(theme === "light" ? "dark" : "light")}
				>
					{theme === "light" ? (
						<BrightnessMediumIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
					) : (
						<DarkModeIcon sx={{ fontSize: 20 }} />
					)}
				</motion.div>
			</ul>

			{/* Mobile Navigation */}
			<div className="flex gap-3 sm:hidden items-center">
				<motion.div
					whileTap={{ scale: 0.9 }}
					className="w-10 h-10 flex justify-center items-center rounded-xl cursor-pointer bg-slate-100/50 dark:bg-slate-800/50"
					onClick={() => setTheme(theme === "light" ? "dark" : "light")}
				>
					{theme === "light" ? (
						<BrightnessMediumIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
					) : (
						<DarkModeIcon sx={{ fontSize: 20 }} />
					)}
				</motion.div>
				<CurrencySelector />
				<motion.div
					whileTap={{ scale: 0.9 }}
					className="w-10 h-10 flex justify-center items-center rounded-xl cursor-pointer bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
					onClick={toggleMenu}
				>
					{menu ? <CloseIcon /> : <MenuIcon />}
				</motion.div>
			</div>
		</motion.div>
	);
};

export default Header;
