import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { chatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";

const AIChatbot = ({ coins = [], portfolio = {} }) => {
	const { isAuthenticated } = useAuth();
	const { currency } = useCurrency();
	const currencyCode = currency ? currency[0].toLowerCase() : "usd";
	
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([
		{
			sender: "ai",
			text: "Hi! I am **CryptoTrack AI**, your intelligent cryptocurrency analyst and portfolio advisor. 🚀\n\nHow can I help you navigate the crypto markets today?",
		},
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [showScrollBtn, setShowScrollBtn] = useState(false);

	const messagesEndRef = useRef(null);
	const chatContainerRef = useRef(null);

	// Suggested starters
	const starterQuestions = [
		{ text: "📊 Analyze my portfolio", authOnly: true },
		{ text: "🔥 What are the top trending coins?", authOnly: false },
		{ text: "💡 Explain Bitcoin halving simply", authOnly: false },
		{ text: "📈 Tips for a balanced crypto portfolio", authOnly: false },
	];

	// Scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		if (isOpen) {
			setTimeout(scrollToBottom, 100);
		}
	}, [isOpen, messages]);

	// Handle scroll visibility for "scroll to bottom" button
	const handleScroll = () => {
		if (!chatContainerRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
		// If scrolled up more than 100px from the bottom, show button
		setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
	};

	const handleSend = async (textToSend) => {
		const messageText = textToSend || input;
		if (!messageText.trim()) return;

		if (!textToSend) setInput("");

		// Append user message
		const updatedMessages = [...messages, { sender: "user", text: messageText }];
		setMessages(updatedMessages);
		setLoading(true);

		try {
			// Construct context
			const chatContext = {
				coins,
				portfolio,
				currency: currencyCode,
			};

			// Build history for API, excluding the latest message
			const history = updatedMessages.slice(1, -1);

			const result = await chatAPI.send(messageText, history, chatContext);

			setMessages((prev) => [
				...prev,
				{
					sender: "ai",
					text: result.text,
					warning: result.warning,
				},
			]);
		} catch (error) {
			console.error("AI Chat Error:", error);
			// Show the server's reason when it sent one (e.g. "AI is busy, try again")
			const serverMessage = error.response?.data?.error;
			setMessages((prev) => [
				...prev,
				{
					sender: "ai",
					text: serverMessage
						? `⏳ ${serverMessage}`
						: "❌ **Failed to connect with AI Assistant.**\n\nThe server may be waking up (this can take up to a minute on the free plan). Please try again shortly.",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleClearChat = () => {
		setMessages([
			{
				sender: "ai",
				text: "Chat history cleared. How can I help you analyze the market or your portfolio now? 📈",
			},
		]);
	};

	// Helper to format response text (simple custom markdown parser)
	const renderFormattedText = (text) => {
		if (!text) return "";
		const lines = text.split("\n");
		
		return lines.map((line, idx) => {
			// Bullet points
			if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
				const content = line.trim().replace(/^[-*]\s+/, "");
				return (
					<li key={idx} className="ml-5 list-disc my-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
						{parseInlineMarkdown(content)}
					</li>
				);
			}

			// Numbered points
			const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
			if (numMatch) {
				return (
					<li key={idx} className="ml-5 list-decimal my-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
						{parseInlineMarkdown(numMatch[2])}
					</li>
				);
			}

			// Normal line with inline markdown
			return (
				<p key={idx} className="my-1.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 min-h-[1em]">
					{parseInlineMarkdown(line)}
				</p>
			);
		});
	};

	const parseInlineMarkdown = (text) => {
		// Parse bold (**text**)
		const parts = text.split(/(\*\*.*?\*\*)/g);
		return parts.map((part, index) => {
			if (part.startsWith("**") && part.endsWith("**")) {
				return (
					<strong key={index} className="font-bold text-slate-950 dark:text-white">
						{part.slice(2, -2)}
					</strong>
				);
			}

			// Parse inline code (`code`)
			const codeParts = part.split(/(`.*?`)/g);
			return codeParts.map((subPart, subIndex) => {
				if (subPart.startsWith("`") && subPart.endsWith("`")) {
					return (
						<code
							key={subIndex}
							className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-xs text-indigo-600 dark:text-indigo-400 border border-slate-300 dark:border-slate-700"
						>
							{subPart.slice(1, -1)}
						</code>
					);
				}
				return subPart;
			});
		});
	};

	return (
		<>
			{/* Floating Trigger Button */}
			<motion.button
				onClick={() => setIsOpen(!isOpen)}
				className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30 dark:shadow-indigo-500/20 cursor-pointer transition-transform border border-white/10"
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				aria-label="AI Assistant"
			>
				{isOpen ? (
					<CloseIcon sx={{ fontSize: 24 }} />
				) : (
					<motion.div
						animate={{ scale: [1, 1.08, 1] }}
						transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
						className="flex items-center justify-center"
					>
						<ChatBubbleIcon sx={{ fontSize: 24 }} />
					</motion.div>
				)}
			</motion.button>

			{/* Chat window drawer */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: 50, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 50, scale: 0.95 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
						className="fixed bottom-24 right-6 z-50 w-[90vw] sm:w-[400px] h-[550px] max-h-[80vh] glass-card rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-slate-200/50 dark:border-slate-800/80"
					>
						{/* Header */}
						<div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-indigo-900/90 dark:to-blue-900/90 text-white px-4 py-3 flex justify-between items-center shadow-md">
							<div className="flex items-center gap-2">
								<div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
									<SmartToyIcon className="text-white" sx={{ fontSize: 20 }} />
								</div>
								<div>
									<h3 className="font-bold text-sm tracking-wide">CryptoTrack AI</h3>
									<span className="text-[10px] text-blue-100 flex items-center gap-1">
										<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
										Live Market Advisor
									</span>
								</div>
							</div>
							<div className="flex items-center gap-1">
								<button
									onClick={handleClearChat}
									className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
									title="Clear Chat"
								>
									<DeleteSweepIcon sx={{ fontSize: 18 }} />
								</button>
								<button
									onClick={() => setIsOpen(false)}
									className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
								>
									<CloseIcon sx={{ fontSize: 18 }} />
								</button>
							</div>
						</div>

						{/* Messages Area */}
						<div
							ref={chatContainerRef}
							onScroll={handleScroll}
							className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20"
						>
							{messages.map((msg, index) => (
								<div
									key={index}
									className={`flex ${
										msg.sender === "user" ? "justify-end" : "justify-start"
									}`}
								>
									<div
										className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
											msg.sender === "user"
												? "bg-blue-600 text-white rounded-br-none"
												: msg.warning
												? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-slate-800 dark:text-slate-100 rounded-bl-none"
												: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none"
										}`}
									>
										{renderFormattedText(msg.text)}
									</div>
								</div>
							))}

							{/* Thinking Indicator */}
							{loading && (
								<div className="flex justify-start">
									<div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm flex items-center gap-1">
										<span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
										<span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
										<span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Float scroll down button */}
						{showScrollBtn && (
							<button
								onClick={scrollToBottom}
								className="absolute bottom-20 right-6 p-2 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
							>
								<ArrowDownwardIcon sx={{ fontSize: 16 }} />
							</button>
						)}

						{/* Quick Starters & Input Area */}
						<div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
							{/* Starters */}
							{messages.length <= 2 && !loading && (
								<div className="flex flex-wrap gap-1.5 mb-3 overflow-x-auto pb-1">
									{starterQuestions
										.filter((q) => !q.authOnly || isAuthenticated)
										.map((q, idx) => (
											<button
												key={idx}
												onClick={() => handleSend(q.text.replace(/^[^\s]+\s+/, ""))}
												className="text-xs px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-800 text-slate-600 dark:text-slate-300 transition-colors duration-200 cursor-pointer whitespace-nowrap"
											>
												{q.text}
											</button>
										))}
								</div>
							)}

							{/* Input bar */}
							<div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all duration-300">
								<textarea
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={handleKeyPress}
									placeholder={
										isAuthenticated
											? "Ask about coins, concepts, or your portfolio..."
											: "Ask anything about crypto or sign up to analyze..."
									}
									className="flex-1 resize-none bg-transparent outline-none border-none text-sm text-slate-800 dark:text-slate-200 max-h-16 h-5 font-sans"
									rows={1}
								/>
								<button
									onClick={() => handleSend()}
									disabled={loading || !input.trim()}
									className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
										input.trim() && !loading
											? "bg-blue-600 text-white shadow-md hover:bg-blue-700 cursor-pointer active:scale-95"
											: "text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
									}`}
								>
									<SendIcon sx={{ fontSize: 16 }} />
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default AIChatbot;
