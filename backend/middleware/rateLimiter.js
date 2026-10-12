const setRateLimit = require("express-rate-limit");
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1"
  );
};

const authLimiter = setRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || req.query?.email || "")
      .toLowerCase()
      .trim();
    const ip = getClientIp(req);
    return email ? `${ip}_${email}` : ip;
  },
  message: {
    success: false,
    message:
      "Too many failed attempts for this account from your network. Please try again after 15 minutes.",
  },
});

const emailLimiter = setRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || req.query?.email || "")
      .toLowerCase()
      .trim();
    const ip = getClientIp(req);
    return email ? `${ip}_${email}` : ip;
  },
  message: {
    success: false,
    message:
      "Too many email requests. Please wait 1 hour before requesting another email.",
  },
});

const registerLimiter = setRateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 15 : 100,
  skipFailedRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    success: false,
    message:
      "Too many accounts created from this network. Please try again after 1 hour.",
  },
});

const userApiLimiter = setRateLimit({
  windowMs: 15 * 60 * 1000,
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

const globalLimiter = setRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: {
    success: false,
    message:
      "Too many requests to the server from this network. Please slow down.",
  },
});

const notificationLimiter = setRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user && (req.user.id || req.user._id)) {
      return `notif_${req.user.id || req.user._id}`;
    }
    return getClientIp(req);
  },
  message: {
    success: false,
    message: "Notification sync rate limit reached. Please slow down.",
  },
});

module.exports = {
  authLimiter,
  emailLimiter,
  registerLimiter,
  userApiLimiter,
  globalLimiter,
  notificationLimiter,
};
