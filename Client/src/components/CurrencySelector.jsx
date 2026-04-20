import { useCurrency } from "../context/CurrencyContext";
import useCurrencyData from "../hooks/useCurrencyData";

const CurrencySelector = () => {
	const { currency, setCurrency } = useCurrency();
	const { currencyData, loading, error } = useCurrencyData();

	return (
		<div className="relative">
			<select
				className="appearance-none bg-white/70 backdrop-blur-sm border border-gray-200 text-sm text-gray-700 font-semibold py-2 px-4 pr-8 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] focus:ring-2 focus:ring-blue-500/50 cursor-pointer outline-none dark:bg-slate-800/70 dark:border-slate-700 dark:text-gray-200 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md"
				value={currency[0]}
				onChange={(e) =>
					setCurrency([
						e.target.value,
						currencyData.rates?.[e.target.value] || 1,
					])
				}
			>
				{loading && <option>USD</option>}
				{error && <option value="USD">USD</option>}
				{!loading && !error && (
					<>
						<option key={"USD"}>USD</option>
						{Object.keys(currencyData.rates || {}).map(
							(currencyName) => (
								<option key={currencyName}>{currencyName}</option>
							)
						)}
					</>
				)}
			</select>
			<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
				<svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
					<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
				</svg>
			</div>
		</div>
	);
};

export default CurrencySelector;
