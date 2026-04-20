import CoinRow from "./CoinRow";

const Table = ({
	loading,
	error,
	coins,
	toggleWatchlist,
	watchlist,
	message,
	toggleForm,
}) => {
	return (
		<table className="w-full min-w-[760px] text-left glass-panel rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
			<thead>
				<tr className="bg-slate-100/50 border-b border-slate-200/50 dark:bg-slate-800/50 dark:border-slate-700/50">
					{["Rank", "Name", "Price", "24H %", "Market Cap", ""].map(
						(header) => (
							<th
								key={header}
								className="px-6 py-3 text-left text-xs font-semibold text-gray-500 tracking-wider uppercase dark:text-gray-400"
							>
								{header}
							</th>
						)
					)}
				</tr>
			</thead>
			<tbody>
				{message && (
					<tr>
						<td
							colSpan="6"
							className="text-center p-8 text-gray-500 dark:text-gray-400"
						>
							{message}
						</td>
					</tr>
				)}
				{loading && (
					<tr>
						<td
							colSpan="6"
							className="text-center p-8 text-gray-500 dark:text-gray-400"
						>
							Loading data...
						</td>
					</tr>
				)}
				{error && (
					<tr>
						<td
							colSpan="6"
							className="text-center p-12"
						>
							<div className="flex flex-col items-center justify-center space-y-4">
								<div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center shadow-inner dark:bg-red-500/20">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
								</div>
								<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Temporarily Unavailable</h3>
								<p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">We couldn't fetch the latest crypto data right now. This is usually due to API rate limits. Please try again in a moment.</p>
							</div>
						</td>
					</tr>
				)}
				{!loading &&
					!error &&
					coins.map((coin) => (
						<CoinRow
							key={coin.id}
							coin={coin}
							isStarred={watchlist.includes(coin.id)}
							toggleWatchlist={toggleWatchlist}
							toggleForm={toggleForm}
						/>
					))}
			</tbody>
		</table>
	);
};

export default Table;
