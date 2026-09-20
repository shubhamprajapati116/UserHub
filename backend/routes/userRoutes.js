const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const verifyToken = require("../middleware/verifytoken");
const verifyAdmin = require("../middleware/VerifyAdmin");
const {
  authLimiter,
  emailLimiter,
  registerLimiter,
  userApiLimiter,
} = require("../middleware/rateLimiter");
const {
  getUsers,
  deleteuser,
  updateuser,
  makeAdmin,
  getUserById,
  addUser,
  verifyEmail,
  cancelPendingEmailChange,
  resendPendingEmailVerification,
  bulkDeleteUsers,
  bulkUpdateRole,
  getUserGrowthAnalytics,
  getAdminStats,
  revokeUserSessions,
  updateUserStatus,
} = require("../controllers/usercontroller");
const {
  registeruser,
  loginuser,
  forgotpassword,
  resetPassword,
  verifyResetToken,
  logoutCurrentDevice,
  logoutOtherSessions,
  getSessions,
  logoutSession,
  resendLoginOtp,
  verifyLoginOtp,
  resendVerificationEmail,
} = require("../controllers/Authcontroller");
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
} = require("../controllers/profileController");

router.get("/profile", verifyToken, userApiLimiter, getProfile);
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
  "/register",
  registerLimiter,
  upload.single("profilephoto"),
  registeruser,
);

// Admin Management Routes
router.get("/api/admin/users", verifyToken, verifyAdmin, getUsers);
router.post(
  "/api/admin/users",
  verifyToken,
  verifyAdmin,
  upload.single("profilephoto"),
  addUser,
);
router.post(
  "/api/admin/users/bulk-delete",
  verifyToken,
  verifyAdmin,
  bulkDeleteUsers,
);
router.put(
  "/api/admin/users/bulk-role",
  verifyToken,
  verifyAdmin,
  bulkUpdateRole,
);
router.delete("/logout", verifyToken, logoutCurrentDevice);
router.delete(
  "/sessions/logout-others",
  verifyToken,
  userApiLimiter,
  logoutOtherSessions,
);
router.get("/sessions", verifyToken, userApiLimiter, getSessions);
router.delete(
  "/sessions/:sessionId",
  verifyToken,
  userApiLimiter,
  logoutSession,
);
router.get(
  "/api/admin/analytics/user-growth",
  verifyToken,
  verifyAdmin,
  getUserGrowthAnalytics,
);
router.get("/api/admin/stats", verifyToken, verifyAdmin, getAdminStats);
router.get("/admin/stats", verifyToken, verifyAdmin, getAdminStats);
router.get("/api/admin/users/:id", verifyToken, verifyAdmin, getUserById);
router.put(
  "/api/admin/users/:id",
  verifyToken,
  verifyAdmin,
  upload.single("profilephoto"),
  updateuser,
);
router.delete("/api/admin/users/:id", verifyToken, verifyAdmin, deleteuser);
router.delete(
  "/api/admin/users/:id/pending-email",
  verifyToken,
  verifyAdmin,
  cancelPendingEmailChange,
);
router.post(
  "/api/admin/users/:id/resend-pending-email",
  verifyToken,
  verifyAdmin,
  emailLimiter,
  resendPendingEmailVerification,
);
router.put("/api/admin/users/:id/role", verifyToken, verifyAdmin, makeAdmin);
router.post(
  "/api/admin/users/:id/revoke-session",
  verifyToken,
  verifyAdmin,
  revokeUserSessions,
);

router.patch(
  "/api/admin/users/:id/status",
  verifyToken,
  verifyAdmin,
  updateUserStatus,
);

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
router.delete("/account-delete", verifyToken, userApiLimiter, deleteProfile);
router.post("/verify-login-otp", authLimiter, verifyLoginOtp);
router.post("/resend-login-otp", emailLimiter, resendLoginOtp);
router.post("/login", authLimiter, loginuser);
router.post("/forgot-password", emailLimiter, forgotpassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password/:token", authLimiter, resetPassword);
router.post("/resend-verification", emailLimiter, resendVerificationEmail);
router.get("/verify-email/:token", verifyEmail);
router.post(
  "/profile/resend-pending-verification",
  verifyToken,
  emailLimiter,
  resendPendingEmailVerification,
);
router.put("/change-password", verifyToken, authLimiter, changepassword);
module.exports = router;
