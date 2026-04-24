const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
	serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
})
.then(() => console.log("Mongoose connected successfully"))
.catch(err => console.error("Mongoose connection error:", err));

const db = mongoose.connection;

db.on("connected", () => {
	console.log("Connected to DB");
});

db.on("error", (err) => {
	console.log("Connection Error:", err);
});

db.on("disconnected", () => {
	console.log("Disconnected from DB");
});

module.exports = db;
