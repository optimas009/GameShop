const User = require("../models/User");

async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("role");
    if (!user) return res.status(401).send({ message: "User not found" });

    if (user.role !== "admin") {
      return res.status(403).send({ message: "Admin access required" });
    }

    next();
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

async function blockAdminPurchase(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("role");
    if (!user) return res.status(401).send({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(403).send({
        message: "Admins cannot purchase. Please login with a user account.",
      });
    }

    next();
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

module.exports = { requireAdmin, blockAdminPurchase };
