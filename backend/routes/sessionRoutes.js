const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifytoken");
const { userApiLimiter } = require("../middleware/rateLimiter");

const {
  logoutCurrentDevice,
  logoutOtherSessions,
  getSessions,
  logoutSession,
} = require("../controllers/sessionController");

router.delete("/logout", verifyToken, logoutCurrentDevice);
router.delete(
  "/sessions/logout-others",
  verifyToken,
  userApiLimiter,
  logoutOtherSessions
);
router.get("/sessions", verifyToken, userApiLimiter, getSessions);
router.delete(
  "/sessions/:sessionId",
  verifyToken,
  userApiLimiter,
  logoutSession
);

module.exports = router;
