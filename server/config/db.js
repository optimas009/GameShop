const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/Node";

    await mongoose.connect(uri);

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
