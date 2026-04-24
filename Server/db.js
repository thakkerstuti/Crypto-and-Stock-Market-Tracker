const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in environment variables");
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ Mongoose connected successfully to:", MONGODB_URI))
    .catch(err => {
        console.error("❌ Mongoose connection error:", err);
        console.error("Make sure your MongoDB server is running and the URI is correct.");
    });

const db = mongoose.connection;

db.on("connected", () => {
    console.log("📡 Connected to MongoDB");
});

db.on("error", (err) => {
    console.error("🔴 MongoDB Connection Error:", err);
});

db.on("disconnected", () => {
    console.warn("🔌 Disconnected from MongoDB");
});

module.exports = db;
