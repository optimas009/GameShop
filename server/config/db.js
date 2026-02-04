const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not defined");

    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log("✅ MongoDB Atlas connected");
  } catch (err) {
    console.error("⚠️ MongoDB connection failed (will retry):", err.message);
    //  Don't kill the server on Render
  }
};

module.exports = connectDB;
