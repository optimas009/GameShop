const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,

  role: { type: String, enum: ["user", "admin"], default: "user" },

  isVerified: { type: Boolean, default: false },

  // OTP fields
  emailVerifyCode: String,
  emailVerifyExpires: Date,
  emailVerifyAttempts: { type: Number, default: 0 },
});

// ✅ TTL index: auto delete unverified users when emailVerifyExpires time passes
userSchema.index(
  { emailVerifyExpires: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { isVerified: false }, // only unverified
  }
);

module.exports = mongoose.model("users", userSchema);
