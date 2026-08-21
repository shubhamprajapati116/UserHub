const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const verifyToken = require("../middleware/verifytoken");
const verifyAdmin = require("../middleware/VerifyAdmin");
const {
  getUsers,
  deleteuser,
  updateuser,
  makeAdmin,
  getUserById,
  addUser,
  verifyEmail,
  bulkDeleteUsers,
  bulkUpdateRole,
} = require("../controllers/usercontroller");
const {
  registeruser,
  loginuser,
  forgotpassword,
  resetPassword,
  logoutCurrentDevice,
  logoutOtherSessions,
  getSessions,
  logoutSession,
  resendLoginOtp,
  verifyLoginOtp,
} = require("../controllers/Authcontroller");
const {
  getProfile,
  updateProfile,
  deleteProfile,
  changepassword,
  addExperience,
  updateExperienceItem,
  deleteExperienceItem,
  updateNotificationPreferences,
} = require("../controllers/profileController");

router.get("/profile", verifyToken, getProfile);
router.put(
  "/notification-preferences",
  verifyToken,
  updateNotificationPreferences,
);
router.post("/profile/experience", verifyToken, addExperience);
router.put("/profile/experience/:expId", verifyToken, updateExperienceItem);
router.delete("/profile/experience/:expId", verifyToken, deleteExperienceItem);

router.post("/register", upload.single("profilephoto"), registeruser);
// Legacy Admin Routes
router.get("/Users", verifyToken, verifyAdmin, getUsers);
router.get("/Users/:id", verifyToken, verifyAdmin, getUserById);
router.delete("/Users/:id", verifyToken, verifyAdmin, deleteuser);
router.put(
  "/Users/:id",
  verifyToken,
  verifyAdmin,
  upload.single("profilephoto"),
  updateuser,
);
router.post(
  "/admin/users",
  verifyToken,
  verifyAdmin,
  upload.single("profilephoto"),
  addUser,
);
router.put("/Users/:id/make-admin", verifyToken, verifyAdmin, makeAdmin);

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
router.delete("/sessions/logout-others", verifyToken, logoutOtherSessions);
router.get("/sessions", verifyToken, getSessions);
router.delete("/sessions/:sessionId", verifyToken, logoutSession);
router.get("/api/admin/users/:id", verifyToken, verifyAdmin, getUserById);
router.put(
  "/api/admin/users/:id",
  verifyToken,
  verifyAdmin,
  upload.single("profilephoto"),
  updateuser,
);
router.delete("/api/admin/users/:id", verifyToken, verifyAdmin, deleteuser);
router.put("/api/admin/users/:id/role", verifyToken, verifyAdmin, makeAdmin);

router.put(
  "/profile",
  verifyToken,
  upload.single("profilephoto"),
  updateProfile,
);
router.delete("/account-delete", verifyToken, deleteProfile);
router.post("/verify-login-otp", verifyLoginOtp);
router.post("/resend-login-otp", resendLoginOtp); 
router.post("/login", loginuser);
router.post("/forgot-password", forgotpassword);
router.post("/reset-password/:token", resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.put("/change-password", verifyToken, changepassword);
module.exports = router;
