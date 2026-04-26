const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    process.exit(1);
}

const connectDB = async () => {
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
    console.error("🔴 MongoDB Connection Error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.warn("🔌 Disconnected from MongoDB");
});

module.exports = connectDB;
