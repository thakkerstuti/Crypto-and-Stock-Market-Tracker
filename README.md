# Crypto and Stock Market Tracker

A web application to track real-time cryptocurrency prices, manage a personal portfolio, and maintain a watchlist of favorite coins.

## Table of Contents

- [Description](#description)
- [About / Why I Built This](#about--why-i-built-this)
- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Attributions](#attributions)
- [Contact](#contact)

## Description

Crypto and Stock Market Tracker is a web application that allows users to track real-time cryptocurrency prices, manage their portfolio, and maintain a watchlist. Users can register, log in, add/remove coins to their portfolio or watchlist, and export their portfolio data as PDF or CSV reports.

## About / Why I Built This

I built this project because I wanted to learn how to build and deploy a complete full-stack web application from scratch. Specifically, I wanted to master:
- **Real-Time Data Handling & Caching:** Interfacing with third-party market APIs (CoinGecko, Frankfurter) efficiently. I implemented a custom in-memory caching proxy layer on the Node/Express backend to prevent hitting rate limits and fallback cleanly to mock data when needed.
- **Dynamic Data Visualization:** Using charting libraries (Recharts) to show complex portfolio allocations and performance metrics dynamically.
- **Full-Stack Deployment:** Configuring a monorepo setup for Vercel (frontend) and Render (backend).

The hardest part of this project was **getting the deployment configuration and networking setup right**. Ensuring that routing between a frontend on Vercel and a backend on Render worked seamlessly (solving CORS and path routing through `vercel.json` rules) required substantial trial and error. Additionally, resolving network binding issues—specifically configuring Express to listen on host `0.0.0.0` to properly handle incoming IPv4/IPv6 connections from cloud environments—was a key learning experience. Overcoming these API routing and server-binding hurdles taught me how critical network configuration is for production-ready deployments.

## Live Demo

The application is deployed and publicly accessible:

- **Frontend (Vercel):** [`https://cryptotrack-ultimez.vercel.app/`](https://cryptotrack-ultimez.vercel.app/)
- **Backend (Render):** [`https://cryptotrack-rhun.onrender.com`](https://cryptotrack-rhun.onrender.com)

_Note: The backend is hosted on a free Render instance, so the initial server response might be slow as the instance "wakes up" from a sleep state._

## Features

- User authentication (register, login, logout)
- Real-time cryptocurrency prices (via CoinGecko API)
- Search cryptocurrency
- Add/remove coins to portfolio and watchlist
- Portfolio performance analytics (profit/loss, allocation chart, top gainers, top losers)
- Export your portfolio report in both PDF and CSV formats.
- View portfolio values in different fiat currencies (via Frankfurter API)
- Dark mode support with theme persistence
- Integrated Gemini AI Assistant for personalized portfolio suggestions and market insights

## Tech Stack

The project is built with the MERN stack and other modern technologies:

- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose)
- **Authentication:** JWT, Passport.js
- **APIs:** CoinGecko (crypto data), Frankfurter (currency conversion), Google Gemini API (AI chatbot)
- **Key Libraries:**
    - `axios`: For making API requests.
    - `recharts`: For creating pie chart and bar chart.
    - `framer-motion`: For UI animations.
    - `jspdf` & `jspdf-autotable`: For generating PDF reports.
    - `React-toastify`: For alerts.

## Screenshots

### Home Page
<img src="./images/home.png" alt="Home Page" width="800px">
Search and view top cryptocurrencies, add to watchlist or portfolio.

### Login Page
<img src="./images/login.png" alt="Login Page" width="800px">
Login for registered users.

### Sign Up Page
<img src="./images/signup.png" alt="Sign Up Page" width="800px">
Register a new account.

### Dashboard
<img src="./images/dashboard-top.png" alt="Dashboard - Top" width="800px">
<br>
<img src="./images/dashboard-bottom.png" alt="Dashboard - Bottom" width="800px">
View portfolio summary, allocation charts, and top gainers/losers.

### Watchlist
<img src="./images/watchlist.png" alt="Watchlist" width="800px">
Manage your favorite coins.

### Dark Mode
<img src="./images/dark.png" alt="Dark Mode" width="800px">
Toggle between light and dark themes with persistent preference.

### Exported PDF
<img src="./images/pdf.png" alt="Exported PDF" width="800px">
Downloadable portfolio report in PDF format.

### Exported CSV
<img src="./images/csv.png" alt="Exported CSV" width="800px">
Downloadable portfolio report in CSV format.

## Getting Started

Follow these instructions to set up and run the project locally on your machine.

### Prerequisites

- Node.js (v18 or later recommended)
- Git
- MongoDB Community Server

### 1. Clone the Repository

```bash
git clone https://github.com/thakkerstuti/Crypto-and-Stock-Market-Tracker.git
cd Crypto-and-Stock-Market-Tracker
```

### 2. Backend Setup

Navigate to the server directory and install dependencies.

```bash
cd Server
npm install
```

#### Setup Local MongoDB

1.  Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community) if you haven't already.
2.  Start the MongoDB service on your machine. On most systems, you can run `mongod` in a terminal.
3.  The backend will connect to the default local URI.

#### Environment Variables

Create a `.env` file in the `Server` directory and add the following variables.

```env
MONGODB_URI="mongodb://127.0.0.1:27017/cryptotrack"
PORT=3000
CLIENT="http://localhost:5173"
JWT_SECRET="YOUR_JWT_SECRET"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

#### Run the Backend Server

```bash
npm start
```

### 3. Frontend Setup

In a new terminal, navigate to the client directory and install dependencies.

```bash
# From the root Crypto-and-Stock-Market-Tracker directory
cd Client
npm install
```

#### Environment Variables

Create a `.env` file in the `Client` directory and add the following:

```env
VITE_API_URL="http://localhost:3000"
```

#### Run the Frontend

```bash
npm run dev
```

The application should now be running at **http://localhost:5173**.

## Attributions

- Cryptocurrency data provided by [CoinGecko API](https://www.coingecko.com/en/api).
- Currency conversion powered by [Frankfurter API](https://www.frankfurter.app/).

## Contact

For any questions, suggestions, or contributions, feel free to open an issue or connect on [GitHub](https://github.com/thakkerstuti).
