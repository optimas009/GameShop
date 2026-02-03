const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isVerified: { type: Boolean, default: false },

  emailVerifyCode: { type: String, default: null },
  emailVerifyExpires: { type: Date, default: null },
  emailVerifyAttempts: { type: Number, default: 0 },
  emailVerifyLastSentAt: { type: Date, default: null },

  resetPasswordCode: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  resetPasswordAttempts: { type: Number, default: 0 },
  resetPasswordLastSentAt: { type: Date, default: null },
});

// TTL index
userSchema.index(
  { emailVerifyExpires: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { isVerified: false },
  }
);

module.exports = mongoose.model("User", userSchema);
