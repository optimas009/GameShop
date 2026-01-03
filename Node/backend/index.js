require("dotenv").config();
require("./db/config");

const mongoose = require("mongoose");

const express = require("express");
const cors = require("cors");
const dns = require("dns").promises;

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



const EMAIL_VERIFY_EXPIRES_MINUTES = 5;
const EMAIL_VERIFY_EXPIRES_MS = EMAIL_VERIFY_EXPIRES_MINUTES * 60 * 1000;


async function hasMxRecord(email) {
  try {
    const domain = email.split("@")[1];
    if (!domain) return false;

    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch (err) {
    return false; // domain not found / no MX
  }
}



function generateOtpCode() {
  // ✅ 6 digit code
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/* ===================== AUTH ===================== */
/* ===================== PASSWORD VALIDATION (reusable) ===================== */
// ✅ Rules:
// 1) length >= 6
// 2) at least 1 uppercase letter
// 3) at least 1 special character
// 4) no 3 consecutive same character (aaa / 111 / !!!)

function validatePassword(pw) {
  const password = String(pw || "");

  if (password.length < 6) {
    return "Password must be at least 6 characters long";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least 1 uppercase letter";
  }

  // special = anything that's not letter/number
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least 1 special character";
  }

  // block 3 consecutive identical characters
  if (/(.)\1\1/.test(password)) {
    return "Password cannot contain 3 consecutive identical characters (e.g., aaa, 111)";
  }

  return null; // ✅ valid
}

/* ===================== REGISTER ===================== */
// ✅ Always registers as "user"
// ✅ Validates email + password rules
// ✅ Hashes password only after validation
// ✅ Sends verification email


app.post("/register", async (req, resp) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    // ✅ email format validation
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return resp.status(400).send({ message: "Invalid email format" });
    }

    // ✅ domain MX check (blocks domains that cannot receive email)
    const mxOk = await hasMxRecord(email);
    if (!mxOk) {
      return resp.status(400).send({ message: "Email domain is not valid" });
    }

    // ✅ password rules validation BEFORE hashing
    const pwError = validatePassword(password);
    if (pwError) {
      return resp.status(400).send({ message: pwError });
    }

    
    // ✅ block duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return resp.status(409).send({ message: "Email already registered" });
    }

    // ✅ hash password AFTER validation
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ generate OTP code + hash
    const code = generateOtpCode();
    const hashedCode = hashOtp(code);

    // ✅ create user (force role=user)
    const newUser = new User({
      name: req.body.name,
      email,
      password: hashedPassword,
      role: "user",
      isVerified: false,
      emailVerifyCode: hashedCode,
      emailVerifyExpires: new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS),
      emailVerifyAttempts: 0,
    });

    // ✅ save user FIRST
    await newUser.save();

    // ✅ try sending verification email
    try {
      await sendVerificationEmail(email, code);
    } catch (e) {
      console.error("EMAIL SEND FAILED:", e.message);

      // ✅ rollback user creation if mail fails
      await User.deleteOne({ email });

      return resp.status(400).send({
        message: "Email address is not deliverable. Please use a real email.",
      });
    }

    return resp.status(200).send({
      message: "Registered successfully. Check your email for the verification code.",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return resp.status(500).send({ message: err.message });
  }
});



/* ===================== ADMIN LOGIN (secret) ===================== */
// ✅ Only admins can login here
// ✅ Generic errors so it doesn't reveal if email exists or not
app.post("/admin/login", async (req, resp) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return resp.status(400).send({ message: "Email and password required" });
    }

    //console.log("ADMIN LOGIN EMAIL:", email);

    const user = await User.findOne({ email });
    //console.log("FOUND USER?", !!user);

    if (!user) {
      return resp.status(401).send({ message: "Invalid credentials" });
    }

    //console.log("ROLE:", user.role, "VERIFIED:", user.isVerified);

    const isMatch = await bcrypt.compare(password, user.password);
    //console.log("PASSWORD MATCH?", isMatch);

    if (!isMatch) {
      return resp.status(401).send({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return resp.status(403).send({ message: "Please verify your email first" });
    }

    if (user.role !== "admin") {
      return resp.status(401).send({ message: "Invalid credentials" });
    }

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.role;

    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return resp.send({ user: safeUser, token });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});


app.post("/verify-email-code", async (req, resp) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").trim();

    if (!email || !code) {
      return resp.status(400).send({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return resp.status(400).send({ message: "Invalid code" });

    // ✅ already verified
    if (user.isVerified) {
      return resp.send({ message: "Already verified" });
    }

    // ✅ expired
    if (!user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
      return resp.status(400).send({ message: "Code expired" });
    }

    // ✅ brute-force protection (optional)
    if ((user.emailVerifyAttempts || 0) >= 5) {
      return resp
        .status(429)
        .send({ message: "Too many attempts. Please request a new code." });
    }

    // ✅ compare hashed code
    const hashed = hashOtp(code);
    if (hashed !== user.emailVerifyCode) {
      user.emailVerifyAttempts = (user.emailVerifyAttempts || 0) + 1;
      await user.save();
      return resp.status(400).send({ message: "Invalid code" });
    }

    // ✅ success
    user.isVerified = true;
    user.emailVerifyCode = undefined;
    user.emailVerifyExpires = undefined;
    user.emailVerifyAttempts = 0;

    await user.save();

    return resp.send({ message: "Email verified successfully" });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});

app.post("/resend-verification-code", async (req, resp) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!email) return resp.status(400).send({ message: "Email required" });

    const user = await User.findOne({ email });

    // ✅ do not reveal if user exists
    if (!user) {
      return resp.status(200).send({ message: "If this email exists, a code was sent." });
    }

    if (user.isVerified) {
      return resp.send({ message: "Already verified" });
    }

    const code = generateOtpCode();
    user.emailVerifyCode = hashOtp(code);
    user.emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS);
    user.emailVerifyAttempts = 0;

    await user.save();
    await sendVerificationEmail(email, code);

    return resp.send({ message: "Verification code resent" });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});

/* ===================== NORMAL USER LOGIN ===================== */
// ✅ Only USERS can login here
// ✅ Admins are blocked silently with "Invalid credentials"
// ✅ Generic errors prevent leaking whether email exists
app.post("/login", async (req, resp) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    // ✅ basic validation
    if (!email || !password) {
      return resp.status(400).send({ message: "Email and password required" });
    }

    // ✅ email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return resp.status(400).send({ message: "Invalid email format" });
    }

    // ✅ generic: do not reveal whether email exists
    const user = await User.findOne({ email });
    if (!user) {
      return resp.status(401).send({ message: "Invalid credentials" });
    }

    // ✅ password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return resp.status(401).send({ message: "Invalid credentials" });
    }

    // ✅ email must be verified
    if (!user.isVerified) {
      return resp.status(403).send({ message: "Please verify your email first" });
    }

    // ✅ block admins from normal login (silent)
    if (user.role === "admin") {
      return resp.status(401).send({ message: "Invalid credentials" });
    }

    // ✅ safe user object (no password, no role)
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.role;

    // ✅ minimal JWT payload (no role in token)
    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return resp.send({ user: safeUser, token });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});


// ✅ returns the real user from DB (trusted)
app.get("/me", verifyToken, async (req, resp) => {
  try {
    const user = await User.findById(req.user._id).select("_id name email role isVerified");
    if (!user) return resp.status(401).send({ message: "User not found" });

    return resp.send(user);
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});


async function requireAdmin(req, resp, next) {
  try {
    const user = await User.findById(req.user._id).select("role");
    if (!user) return resp.status(401).send({ message: "User not found" });

    if (user.role !== "admin") {
      return resp.status(403).send({ message: "Admin access required" });
    }

    next();
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
}



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


/* ===================== GAMES ===================== */

// PUBLIC: list games (always returns array)
app.get("/games", async (req, resp) => {
  try {
    const games = await Game.find();
    return resp.status(200).send(games); // ✅ [] if empty
  } catch (error) {
    return resp.status(500).send({ message: "Server error" });
  }
});

// ADMIN: list games (always returns array, protected)
app.get("/admin/games", verifyToken, requireAdmin, async (req, resp) => {
  try {
    const games = await Game.find();
    return resp.status(200).send(games); // ✅ [] if empty
  } catch (error) {
    return resp.status(500).send({ message: "Server error" });
  }
});


app.post("/admin/games", verifyToken, requireAdmin, async (req, resp) => {
  try {
    const game = new Game(req.body);
    const savedGame = await game.save();
    return resp.status(201).send(savedGame);
  } catch (err) {
    return resp.status(400).send({ message: err.message });
  }
});

app.get("/admin/games/:id", verifyToken, requireAdmin, async (req, resp) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return resp.status(404).send({ message: "Game not found" });
    return resp.status(200).send(game);
  } catch (error) {
    return resp.status(500).send({ message: "Server error" });
  }
});


app.delete("/admin/games/:id", verifyToken, requireAdmin, async (req, resp) => {
  try {
    const result = await Game.findByIdAndDelete(req.params.id);
    if (!result) return resp.status(404).send({ message: "Game not found" });
    return resp.send({ message: "Game deleted successfully" });
  } catch (err) {
    return resp.status(500).send({ message: err.message });
  }
});

app.put("/admin/games/:id", verifyToken, requireAdmin, async (req, resp) => {
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
