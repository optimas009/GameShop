const User = require("../models/User");

function out(status, body) {
  return { status, body };
}

async function getMe(userId) {
  const user = await User.findById(userId).select("_id name email role isVerified");

  if (!user) {
    return out(401, { message: "User not found" });
  }

  return out(200, user);
}

module.exports = {
  getMe,
};
