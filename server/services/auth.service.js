const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");


const { sendVerificationEmail, sendResetPasswordEmail } = require("../email/sendEmail");
const { hasMxRecord, generateOtpCode, hashOtp } = require("../helpers/token.helper");
const { validatePassword } = require("../helpers/password.helper");

/* ===================== AUTH CONSTANTS ===================== */

const EMAIL_VERIFY_EXPIRES_MS = 5 * 60 * 1000; // 5 minutes
const EMAIL_VERIFY_MAX_ATTEMPTS = 5;

const RESET_EXPIRES_MS = 5 * 60 * 1000;        // 5 minutes
const RESET_MAX_ATTEMPTS = 5;

const RESET_RESEND_COOLDOWN_MS = 1 * 1000;     // 1 second

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/;


// helper: keep same response style
function out(status, body) {
    return { status, body };
}

/* ===================== REGISTER ===================== */
async function register(body) {
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;

    const emailRegex = EMAIL_REGEX;
    if (!emailRegex.test(email)) {
        return out(400, { message: "Invalid email format" });
    }

    const mxOk = await hasMxRecord(email);
    if (!mxOk) {
        return out(400, { message: "Email domain is not valid" });
    }

    const pwError = validatePassword(password);
    if (pwError) return out(400, { message: pwError });

    const existingUser = await User.findOne({ email });
    if (existingUser) return out(409, { message: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
    });

    await newUser.save();

    try {
        await sendVerificationEmail(email, code);
    } catch (e) {
        console.error("EMAIL SEND FAILED:", e.message);
        await User.deleteOne({ email });
        return out(400, {
            message: "Email address is not deliverable. Please use a real email.",
        });
    }

    return out(200, {
        message: "Registered successfully. Check your email for the verification code.",
    });
}

/* ===================== EMAIL VERIFY + RESEND ===================== */

async function verifyEmailCode(body) {
    const email = (body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();

    if (!email || !code) {
        return out(400, { message: "Email and code are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return out(400, { message: "Invalid code" });

    if (user.isVerified) return out(200, { message: "Already verified" });

    if (!user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
        return out(400, { message: "Code expired" });
    }

    if ((user.emailVerifyAttempts || 0) >= EMAIL_VERIFY_MAX_ATTEMPTS) {
        return out(429, { message: "Too many attempts. Please request a new code." });
    }
    const hashed = hashOtp(code);
    if (hashed !== user.emailVerifyCode) {
        user.emailVerifyAttempts = (user.emailVerifyAttempts || 0) + 1;
        await user.save();
        return out(400, { message: "Invalid code" });
    }

    user.isVerified = true;
    user.emailVerifyCode = undefined;
    user.emailVerifyExpires = undefined;
    user.emailVerifyAttempts = 0;

    await user.save();

    return out(200, { message: "Email verified successfully" });
}

async function resendVerificationCode(body) {
    const email = (body.email || "").trim().toLowerCase();
    if (!email) return out(400, { message: "Email required" });

    const user = await User.findOne({ email });

    if (!user) {
        return out(200, { message: "If this email exists, a code was sent." });
    }

    if (user.isVerified) return out(200, { message: "Already verified" });

    const code = generateOtpCode();
    user.emailVerifyCode = hashOtp(code);
    user.emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS);
    user.emailVerifyAttempts = 0;

    await user.save();
    await sendVerificationEmail(email, code);

    return out(200, { message: "Verification code resent" });
}

/* ===================== FORGOT PASSWORD ===================== */

async function forgotPassword(body) {
    const email = (body.email || "").trim().toLowerCase();
    if (!email) return out(400, { message: "Email required" });

    const generic = { message: "If this email exists, a code was sent." };

    const user = await User.findOne({ email });
    if (!user) return out(200, generic);

    if (!user.isVerified) {
        if (user.resetPasswordLastSentAt) {
            const diff = Date.now() - new Date(user.resetPasswordLastSentAt).getTime();
            if (diff < RESET_RESEND_COOLDOWN_MS) {
                return out(403, {
                    reason: "NOT_VERIFIED",
                    message: "Your email is not verified. Please check your inbox (or try again shortly).",
                });
            }
        }

        const code = generateOtpCode();
        user.emailVerifyCode = hashOtp(code);
        user.emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS);
        user.emailVerifyAttempts = 0;

        user.resetPasswordLastSentAt = new Date();

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

    if (user.resetPasswordLastSentAt) {
        const diff = Date.now() - new Date(user.resetPasswordLastSentAt).getTime();
        if (diff < RESET_RESEND_COOLDOWN_MS) return out(200, generic);
    }

    const code = generateOtpCode();
    user.resetPasswordCode = hashOtp(code);
    user.resetPasswordExpires = new Date(Date.now() + RESET_EXPIRES_MS);
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

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    user.resetPasswordAttempts = 0;
    user.resetPasswordLastSentAt = null;

    await user.save();

    return out(200, { message: "Password reset successful. Please login." });
}


/* ===================== Admin Login ===================== */

async function adminLogin(body) {
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
        return out(400, { message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return out(401, { message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return out(401, { message: "Invalid credentials" });

    if (!user.isVerified) {
        return out(403, { message: "Please verify your email first" });
    }

    if (user.role !== "admin") {
        return out(401, { message: "Invalid credentials" });
    }

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.role;

    const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });

    return out(200, { user: safeUser, token });
}


/* ===================== Login ===================== */

async function login(body) {
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
        return out(400, { message: "Email and password required" });
    }

    const emailRegex = EMAIL_REGEX;
    if (!emailRegex.test(email)) {
        return out(400, { message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) return out(401, { message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return out(401, { message: "Invalid credentials" });

    if (!user.isVerified) {
        return out(403, { message: "Please verify your email first" });
    }

    if (user.role === "admin") {
        return out(401, { message: "Invalid credentials" });
    }

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.role;

    const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });

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
