const setRateLimit = require("express-rate-limit");

/**
 * Helper to get clean client IP address
 */
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1"
  );
};

// ── 1. 🔴 Auth Limiter (Login, OTP Verify, Reset Password, Change Password) ──
// Rule: Max 5 attempts per (IP + Normalized Email) combination per 15 minutes.
// Ensures that one employee's failed login in an office Wi-Fi does NOT block other employees.
const authLimiter = setRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased threshold for legitimate user logins & 2FA OTP verifications
  skipSuccessfulRequests: true, // Only failed requests count against rate limit!
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || req.query?.email || "").toLowerCase().trim();
    const ip = getClientIp(req);
    return email ? `${ip}_${email}` : ip;
  },
  message: {
    success: false,
    message:
      "Too many failed attempts for this account from your network. Please try again after 15 minutes.",
  },
});

// ── 2. 🟠 Email Limiter (Forgot Password, Resend OTP) ──
// Rule: Max 3 emails per (IP + Normalized Email) per 1 hour.
// Prevents email quota exhaustion and inbox spamming.
const emailLimiter = setRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || req.query?.email || "").toLowerCase().trim();
    const ip = getClientIp(req);
    return email ? `${ip}_${email}` : ip;
  },
  message: {
    success: false,
    message:
      "Too many email requests. Please wait 1 hour before requesting another email.",
  },
});

// ── 3. 🟡 Register Limiter (New User Registration) ──
// Rule: Max 5 accounts per IP per 1 hour.
// Stops automated registration bots from creating thousands of fake accounts.
const registerLimiter = setRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    success: false,
    message:
      "Too many accounts created from this network. Please try again after 1 hour.",
  },
});

// ── 4. 🟢 User-Based API Limiter (Logged-in APIs like /profile, /sessions, /experience) ──
// Rule: Max 200 requests per User ID per 15 minutes.
// Tracks each logged-in user individually so office Wi-Fi users never interfere with each other.
const userApiLimiter = setRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user && (req.user.id || req.user._id)) {
      return `user_${req.user.id || req.user._id}`;
    }
    return getClientIp(req);
  },
  message: {
    success: false,
    message: "Too many requests from your account. Please slow down.",
  },
});

// ── 5. 🌐 Global Limiter (Server-wide DDoS & Traffic Surge Protection) ──
// Rule: Max 1000 requests per IP per 15 minutes.
// High threshold ensures regular shared Wi-Fi networks are never blocked, while bot flood attacks are stopped.
const globalLimiter = setRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    success: false,
    message: "Too many requests to the server from this network. Please slow down.",
  },
});

module.exports = {
  authLimiter,
  emailLimiter,
  registerLimiter,
  userApiLimiter,
  globalLimiter,
};
