require("dotenv").config();
require("./db/config");

const mongoose = require("mongoose");

const express = require("express");
const cors = require("cors");

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("./db/User");
const Game = require("./db/Game");
const Cart = require("./db/Cart");
const Order = require("./db/Order");

const { sendVerificationEmail } = require("./email/sendEmail");

const app = express();

app.use(cors());
app.use(express.json());
app.disable("etag");

const VERIFY_TOKEN_EXPIRES_MINUTES = 60;
const VERIFY_TOKEN_EXPIRES_MS = VERIFY_TOKEN_EXPIRES_MINUTES * 60 * 1000;

/* ===================== AUTH ===================== */

app.post("/register", async (req, resp) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return resp.status(400).send({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return resp.status(409).send({ message: "Email already registered" });
    }

    req.body.email = email;
    req.body.role = "user";

    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    req.body.isVerified = false;
    req.body.emailVerifyToken = hashedToken;
    req.body.emailVerifyExpires = new Date(Date.now() + VERIFY_TOKEN_EXPIRES_MS);

    const user = new User(req.body);
    await user.save();

    const verifyLink = `${process.env.APP_BASE_URL}/verify-email?token=${rawToken}`;
    await sendVerificationEmail(email, verifyLink);

    return resp.send({
      message: "Registered successfully. Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return resp.status(500).send({ message: err.message });
  }
});

app.post("/login", async (req, resp) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return resp.status(400).send({ message: "Email and password required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return resp.status(400).send({ message: "Invalid email format" });
    }

    let user = await User.findOne({ email });
    if (!user) return resp.status(401).send({ message: "No User" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return resp.status(401).send({ message: "Password Incorrect" });

    if (!user.isVerified) {
      return resp.status(403).send({ message: "Please verify your email first" });
    }

    user = user.toObject();
    delete user.password;

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return resp.send({ user, token });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});

app.get("/verify-email", async (req, resp) => {
  try {
    const { token } = req.query;
    if (!token) return resp.status(400).send({ message: "Token required" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpires: { $gt: new Date() },
    });

    if (!user) return resp.status(400).send({ message: "Invalid or expired token" });

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;

    await user.save();
    return resp.send({ message: "Email verified successfully" });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});

function verifyToken(req, resp, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return resp.status(401).send({ message: "No token provided" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return resp.status(401).send({ message: "Invalid token format" });
  }

  jwt.verify(parts[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) return resp.status(401).send({ message: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
}

function requireAdmin(req, resp, next) {
  if (!req.user || req.user.role !== "admin") {
    return resp.status(403).send({ message: "Admin access required" });
  }
  next();
}

/* ===================== GAMES ===================== */

app.get("/games", async (req, resp) => {
  try {
    const games = await Game.find();
    if (games.length > 0) return resp.status(200).send(games);
    return resp.send({ message: "No games found" });
  } catch (error) {
    return resp.status(500).send({ message: "Server error" });
  }
});

app.post("/games", verifyToken, requireAdmin, async (req, resp) => {
  try {
    const game = new Game(req.body);
    const savedGame = await game.save();
    return resp.status(201).send(savedGame);
  } catch (err) {
    return resp.status(400).send({ message: err.message });
  }
});

app.delete("/games/:id", verifyToken, requireAdmin, async (req, resp) => {
  try {
    const result = await Game.findByIdAndDelete(req.params.id);
    if (!result) return resp.status(404).send({ message: "Game not found" });
    return resp.send({ message: "Game deleted successfully" });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});

app.put("/games/:id", verifyToken, requireAdmin, async (req, resp) => {
  try {
    const updated = await Game.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return resp.status(404).send({ message: "Game not found" });
    return resp.send(updated);
  } catch (err) {
    return resp.status(400).send({ message: err.message });
  }
});

/* ===================== CART ===================== */

// Add to cart (prevents duplicates)
app.post("/cart/add/:gameId", verifyToken, async (req, resp) => {
  try {
    const userId = req.user._id;
    const gameId = req.params.gameId;

    const game = await Game.findById(gameId);
    if (!game) return resp.status(404).send({ message: "Game not found" });

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      await Cart.create({ userId, items: [gameId] });
      return resp.status(200).send({ message: "Added to cart" });
    }

    const alreadyExists = cart.items.some((id) => id.toString() === gameId);
    if (alreadyExists) {
      return resp.status(409).send({ message: "Game is already in your cart" });
    }

    cart.items.push(gameId);
    await cart.save();

    return resp.status(200).send({ message: "Added to cart" });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});

// Get cart (populated)
app.get("/cart", verifyToken, async (req, resp) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId }).populate("items");

    if (!cart) return resp.send({ items: [] });
    return resp.send({ items: cart.items });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});

app.delete("/cart/remove/:gameId", verifyToken, async (req, resp) => {
  try {
    const userId = req.user._id;
    const gameId = req.params.gameId;

    // remove gameId from items array in DB
    const updated = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: gameId } },
      { new: true }
    );

    if (!updated) {
      return resp.status(404).send({ message: "Cart not found" });
    }

    // OPTIONAL: if cart is empty, delete cart document
    if (updated.items.length === 0) {
      await Cart.deleteOne({ userId });
      return resp.send({ message: "Removed. Cart is now empty." });
    }

    return resp.send({ message: "Removed from cart" });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});




// Checkout
app.post("/cart/checkout", verifyToken, async (req, resp) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return resp.status(400).send({ message: "Cart is empty" });
    }

    const games = await Game.find({ _id: { $in: cart.items } });

    const items = games.map((g) => ({
      gameId: g._id,
      title: g.title,
      price: g.price || 0,
      imageUrl: g.imageUrl,
      platform: g.platform,
      genre: g.genre,
    }));

    const total = items.reduce((sum, it) => sum + (it.price || 0), 0);

    const order = new Order({ userId, items, total, status: "paid" });
    await order.save();

    await Cart.deleteOne({ userId });

    return resp.status(201).send({
      message: "Purchase successful",
      orderId: order._id,
    });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});

/* ===================== LIBRARY ===================== */

app.get("/library", verifyToken, async (req, resp) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    const seen = new Set();
    const library = [];

    for (const order of orders) {
      for (const item of order.items) {
        const key = item.gameId?.toString();
        if (!key) continue;

        if (!seen.has(key)) {
          seen.add(key);
          library.push(item); // item already contains title, price, imageUrl, platform, genre
        }
      }
    }

    return resp.send({ library });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});

app.listen(5000);
