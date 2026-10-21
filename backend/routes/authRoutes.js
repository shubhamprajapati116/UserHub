const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  authLimiter,
  emailLimiter,
  registerLimiter,
} = require("../middleware/rateLimiter");

const {
  checkEmailAvailability,
  registeruser,
  loginuser,
  forgotpassword,
  resetPassword,
  verifyResetToken,
  resendLoginOtp,
  verifyLoginOtp,
  resendVerificationEmail,
  getInviteDetails,
  acceptInvite,
} = require("../controllers/Authcontroller");

const { verifyEmail } = require("../controllers/usercontroller");

router.post("/check-email", checkEmailAvailability);

router.post(
  "/register",
  registerLimiter,
  upload.single("profilephoto"),
  registeruser
);

router.post("/login", authLimiter, loginuser);
router.post("/verify-login-otp", authLimiter, verifyLoginOtp);
router.post("/resend-login-otp", emailLimiter, resendLoginOtp);

router.post("/forgot-password", emailLimiter, forgotpassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password/:token", authLimiter, resetPassword);

router.post("/resend-verification", emailLimiter, resendVerificationEmail);
router.get("/verify-email/:token", verifyEmail);

router.get("/invite/:token", getInviteDetails);
router.get("/api/invite/:token", getInviteDetails);
router.post("/invite/:token/accept", authLimiter, acceptInvite);
router.post("/api/invite/:token/accept", authLimiter, acceptInvite);

module.exports = router;

