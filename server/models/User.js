// services/auth.service.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../email/sendEmail");

const { hasMxRecord, generateOtpCode, hashOtp } = require("../helpers/token.helper");
const { validatePassword } = require("../helpers/password.helper");

/* ===================== CONSTANTS ===================== */

const EMAIL_VERIFY_EXPIRES_MS = 5 * 60 * 1000; // 5 minutes
const EMAIL_VERIFY_MAX_ATTEMPTS = 5;
const EMAIL_VERIFY_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds

const RESET_EXPIRES_MS = 5 * 60 * 1000; // 5 minutes
const RESET_MAX_ATTEMPTS = 5;
const RESET_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/i;

// helper: keep same response style
function out(status, body) {
  return { status, body };
}

function msRemaining(lastSentAt, cooldownMs) {
  if (!lastSentAt) return 0;
  const diff = Date.now() - new Date(lastSentAt).getTime();
  return Math.max(0, cooldownMs - diff);
}

/* ===================== REGISTER ===================== */
async function register(body) {
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password;

  if (!EMAIL_REGEX.test(email)) {
    return out(400, { message: "Invalid email format" });
  }

  const mxOk = await hasMxRecord(email);
  if (!mxOk) {
    return out(400, { message: "Email domain is not valid" });
  }

  const pwError = validatePassword(password);
  if (pwError) return out(400, { message: pwError });

  const existing = await User.findOne({ email });
  if (existing) return out(409, { message: "Email already registered" });

  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

  const code = generateOtpCode();
  const hashedCode = hashOtp(code);

  const newUser = new User({
    name: body.name,
    email,
    password: hashedPassword,
    role: "user",
    isVerified: false,

    emailVerifyCode: hashedCode,
    emailVerifyExpires: new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS),
    emailVerifyAttempts: 0,
    emailVerifyLastSentAt: new Date(),
  });

  await newUser.save();

  let emailSent = true;
  try {
    await sendVerificationEmail(email, code);
  } catch (e) {
    emailSent = false;
    console.error("EMAIL SEND FAILED:", e.message);
    // IMPORTANT: Do NOT delete the user and do NOT block signup.
  }

  return out(200, {
    message: emailSent
      ? "Registered successfully. Check your email for the verification code."
      : "Registered successfully, but we could not send email right now. Please use 'Resend code' in a moment.",
  });
}

/* ===================== EMAIL VERIFY ===================== */
async function verifyEmailCode(body) {
  const email = (body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();

  if (!email || !code) return out(400, { message: "Email and code are required" });

  const user = await User.findOne({ email });
  if (!user) return out(400, { message: "Invalid code" });

  if (user.isVerified) return out(200, { message: "Already verified" });

  if (!user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
    return out(400, { message: "Code expired" });
  }

  if ((user.emailVerifyAttempts || 0) >= EMAIL_VERIFY_MAX_ATTEMPTS) {
    return out(429, { message: "Too many attempts. Please request a new code." });
  }

  if (hashOtp(code) !== user.emailVerifyCode) {
    user.emailVerifyAttempts = (user.emailVerifyAttempts || 0) + 1;
    await user.save();
    return out(400, { message: "Invalid code" });
  }

  user.isVerified = true;

  user.emailVerifyCode = null;
  user.emailVerifyExpires = null;
  user.emailVerifyAttempts = 0;
  user.emailVerifyLastSentAt = null;

  await user.save();
  return out(200, { message: "Email verified successfully" });
}

/* ===================== RESEND VERIFICATION CODE ===================== */
async function resendVerificationCode(body) {
  const email = (body.email || "").trim().toLowerCase();
  if (!email) return out(400, { message: "Email required" });

  const user = await User.findOne({ email });

  // do not leak existence
  if (!user) return out(200, { message: "If this email exists, a code was sent." });

  if (user.isVerified) return out(200, { message: "Already verified" });

  // cooldown
  const remaining = msRemaining(user.emailVerifyLastSentAt, EMAIL_VERIFY_RESEND_COOLDOWN_MS);
  if (remaining > 0) {
    return out(429, { message: `Please wait ${Math.ceil(remaining / 1000)}s before requesting another code.` });
  }

  const code = generateOtpCode();
  user.emailVerifyCode = hashOtp(code);
  user.emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS); // keep 5 minutes
  user.emailVerifyAttempts = 0;
  user.emailVerifyLastSentAt = new Date();

  await user.save();

  let sent = true;
  try {
    await sendVerificationEmail(email, code);
  } catch (e) {
    sent = false;
    console.error("RESEND EMAIL FAILED:", e.message);
  }

  return out(200, {
    message: sent
      ? "Verification code resent"
      : "We generated a new code, but email could not be sent right now. Please try again shortly.",
  });
}

/* ===================== FORGOT PASSWORD ===================== */
async function forgotPassword(body) {
  const email = (body.email || "").trim().toLowerCase();
  if (!email) return out(400, { message: "Email required" });

  const generic = { message: "If this email exists, a code was sent." };

  const user = await User.findOne({ email });
  if (!user) return out(200, generic);

  // If not verified: send verification code again (with SAME cooldown system)
  if (!user.isVerified) {
    const remaining = msRemaining(user.emailVerifyLastSentAt, EMAIL_VERIFY_RESEND_COOLDOWN_MS);
    if (remaining > 0) {
      return out(403, {
        reason: "NOT_VERIFIED",
        message: `Your email is not verified. Please wait ${Math.ceil(remaining / 1000)}s then try again.`,
      });
    }

    const code = generateOtpCode();
    user.emailVerifyCode = hashOtp(code);
    user.emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS); // keep 5 minutes
    user.emailVerifyAttempts = 0;
    user.emailVerifyLastSentAt = new Date();

    await user.save();

    try {
      await sendVerificationEmail(email, code);
    } catch (e) {
      console.error("VERIFY EMAIL SEND FAILED:", e.message);
    }

    return out(403, {
      reason: "NOT_VERIFIED",
      message: "Your email is not verified. Verification code sent again.",
    });
  }

  // verified: reset cooldown
  const remaining = msRemaining(user.resetPasswordLastSentAt, RESET_RESEND_COOLDOWN_MS);
  if (remaining > 0) return out(200, generic);

  const code = generateOtpCode();
  user.resetPasswordCode = hashOtp(code);
  user.resetPasswordExpires = new Date(Date.now() + RESET_EXPIRES_MS); // keep 5 minutes
  user.resetPasswordAttempts = 0;
  user.resetPasswordLastSentAt = new Date();

  await user.save();

  try {
    await sendResetPasswordEmail(email, code);
  } catch (e) {
    console.error("RESET EMAIL SEND FAILED:", e.message);
  }

  return out(200, generic);
}

/* ===================== RESET PASSWORD ===================== */
async function resetPassword(body) {
  const email = (body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  const newPassword = body.newPassword;

  if (!email || !code || !newPassword) {
    return out(400, { message: "Email, code and newPassword are required" });
  }

  const pwError = validatePassword(newPassword);
  if (pwError) return out(400, { message: pwError });

  const invalidMsg = { message: "Invalid or expired reset code" };

  const user = await User.findOne({ email });
  if (!user) return out(400, invalidMsg);

  if (!user.resetPasswordCode || !user.resetPasswordExpires) {
    return out(400, invalidMsg);
  }

  if (user.resetPasswordExpires < new Date()) {
    return out(400, invalidMsg);
  }

  if ((user.resetPasswordAttempts || 0) >= RESET_MAX_ATTEMPTS) {
    return out(429, { message: "Too many attempts. Please request a new code." });
  }

  if (hashOtp(code) !== user.resetPasswordCode) {
    user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
    await user.save();
    return out(400, invalidMsg);
  }

  user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));

  user.resetPasswordCode = null;
  user.resetPasswordExpires = null;
  user.resetPasswordAttempts = 0;
  user.resetPasswordLastSentAt = null;

  await user.save();

  return out(200, { message: "Password reset successful. Please login." });
}

/* ===================== ADMIN LOGIN ===================== */
async function adminLogin(body) {
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password;

  if (!email || !password) return out(400, { message: "Email and password required" });

  const user = await User.findOne({ email });
  if (!user) return out(401, { message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return out(401, { message: "Invalid credentials" });

  if (!user.isVerified) return out(403, { message: "Please verify your email first" });

  if (user.role !== "admin") return out(401, { message: "Invalid credentials" });

  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.role;

  const token = jwt.sign(
    { _id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return out(200, { user: safeUser, token });
}

/* ===================== USER LOGIN ===================== */
async function login(body) {
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password;

  if (!email || !password) return out(400, { message: "Email and password required" });

  if (!EMAIL_REGEX.test(email)) return out(400, { message: "Invalid email format" });

  const user = await User.findOne({ email });
  if (!user) return out(401, { message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return out(401, { message: "Invalid credentials" });

  if (!user.isVerified) return out(403, { message: "Please verify your email first" });

  if (user.role === "admin") return out(401, { message: "Invalid credentials" });

  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.role;

  const token = jwt.sign(
    { _id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return out(200, { user: safeUser, token });
}

module.exports = {
  register,
  verifyEmailCode,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  adminLogin,
  login,
};
