const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
    if (!MONGODB_URI) {
        // Don't kill the process: market data and AI chat don't need the database
        throw new Error("MONGODB_URI is not defined in Server/.env");
    }
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("✅ Mongoose connected successfully");
    } catch (err) {
        console.error("❌ Mongoose connection error:", err.message);
        // Don't exit process here, let the caller handle it if needed
        throw err;
    }
};

// Also listen for connection events
mongoose.connection.on("connected", () => {
    console.log("📡 Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
    console.error("🔴 MongoDB Connection Error:", err.message);
});

mongoose.connection.on("disconnected", () => {
    console.warn("🔌 Disconnected from MongoDB");
});

module.exports = connectDB;
