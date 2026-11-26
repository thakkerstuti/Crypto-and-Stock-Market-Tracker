import axios from "axios";

// All backend routes live under /api. Normalise VITE_API_URL so it works whether
// it is set as "https://host" or "https://host/api" (with or without a trailing slash).
const withApiPath = (url) => {
	const base = url.replace(/\/+$/, "");
	return base.endsWith("/api") ? base : `${base}/api`;
};

const API_URL = withApiPath(
	import.meta.env.VITE_API_URL ||
		(import.meta.env.PROD ? window.location.origin : "http://localhost:3000")
);

const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// An expired/invalid JWT returns 401: clear the session so the app sends the
// user back to login instead of showing a dashboard that silently fails.
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401 && localStorage.getItem("token")) {
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			window.dispatchEvent(new Event("auth:expired"));
		}
		return Promise.reject(error);
	}
);

export const authAPI = {
	login: async (username, password) => {
		const response = await api.post("/login", { username, password });
		return response.data;
	},

	register: async (username, password) => {
		const response = await api.post("/register", { username, password });
		return response.data;
	},
};

export const portfolioAPI = {
	get: async () => {
		const response = await api.get("/portfolio");
		return response.data;
	},

	update: async (coin, coinData) => {
		const response = await api.put("/portfolio/update", { coin, coinData });
		return response.data;
	},
};

export const watchlistAPI = {
	get: async () => {
		const response = await api.get("/watchlist");
		return response.data;
	},

	add: async (coin) => {
		const response = await api.put("/watchlist/add", { coin });
		return response.data;
	},

	remove: async (coin) => {
		const response = await api.put("/watchlist/remove", { coin });
		return response.data;
	},
};

export const chatAPI = {
	send: async (message, history = [], context = {}) => {
		const response = await api.post("/chat", { message, history, context });
		return response.data;
	},
};

export default api;
