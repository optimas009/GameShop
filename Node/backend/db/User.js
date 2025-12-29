const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,

  // ✅ NEW: role
  role: { type: String, enum: ["user", "admin"], default: "user" },

  // 🔐 email verification fields
  isVerified: { type: Boolean, default: false },
  emailVerifyToken: String,
  emailVerifyExpires: Date
});

module.exports = mongoose.model("users", userSchema);
