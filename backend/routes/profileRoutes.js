const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const verifyToken = require("../middleware/verifytoken");
const {
  authLimiter,
  emailLimiter,
  userApiLimiter,
} = require("../middleware/rateLimiter");

const {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  requestEmailChange,
  verifyEmailChangeOtp,
  resendEmailChangeOtp,
  cancelEmailChange,
  deleteProfile,
  changepassword,
  addExperience,
  updateExperienceItem,
  deleteExperienceItem,
  updateNotificationPreferences,
  updateBanner,
  emergencyRevokeAccount,
} = require("../controllers/profileController");

const {
  resendPendingEmailVerification,
} = require("../controllers/usercontroller");

router.get("/profile", verifyToken, userApiLimiter, getProfile);
router.put(
  "/profile",
  verifyToken,
  userApiLimiter,
  upload.single("profilephoto"),
  updateProfile,
);
router.put(
  "/profile/photo",
  verifyToken,
  userApiLimiter,
  upload.single("profilephoto"),
  updateProfilePhoto,
);
router.post(
  "/profile/photo",
  verifyToken,
  userApiLimiter,
  upload.single("profilephoto"),
  updateProfilePhoto,
);
router.put("/profile/banner", verifyToken, userApiLimiter, updateBanner);
router.put(
  "/notification-preferences",
  verifyToken,
  userApiLimiter,
  updateNotificationPreferences,
);

router.post("/profile/experience", verifyToken, userApiLimiter, addExperience);
router.put(
  "/profile/experience/:expId",
  verifyToken,
  userApiLimiter,
  updateExperienceItem,
);
router.delete(
  "/profile/experience/:expId",
  verifyToken,
  userApiLimiter,
  deleteExperienceItem,
);

router.post(
  "/profile/request-email-change",
  verifyToken,
  authLimiter,
  requestEmailChange,
);
router.post(
  "/profile/verify-email-otp",
  verifyToken,
  authLimiter,
  verifyEmailChangeOtp,
);

router.post(
  "/profile/resend-email-otp",
  verifyToken,
  emailLimiter,
  resendEmailChangeOtp,
);
router.delete(
  "/profile/cancel-email-change",
  verifyToken,
  userApiLimiter,
  cancelEmailChange,
);
router.post(
  "/profile/resend-pending-verification",
  verifyToken,
  emailLimiter,
  resendPendingEmailVerification,
);

router.put("/change-password", verifyToken, authLimiter, changepassword);
router.delete("/account-delete", verifyToken, userApiLimiter, deleteProfile);

router.get(
  "/api/security/emergency-lock/:token",
  authLimiter,
  emergencyRevokeAccount,
);
router.get(
  "/security/emergency-lock/:token",
  authLimiter,
  emergencyRevokeAccount,
);

module.exports = router;
