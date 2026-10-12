const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const verifyToken = require("../middleware/verifytoken");
const verifyAdmin = require("../middleware/VerifyAdmin");
const { emailLimiter } = require("../middleware/rateLimiter");

const {
  getUsers,
  deleteuser,
  updateuser,
  makeAdmin,
  getUserById,
  addUser,
  cancelPendingEmailChange,
  resendPendingEmailVerification,
  bulkDeleteUsers,
  bulkUpdateRole,
  getUserGrowthAnalytics,
  getAdminStats,
  revokeUserSessions,
  updateUserStatus,
  validateInviteEmail,
  resendInvite,
  cancelInvite,
} = require("../controllers/adminController");

router.post(
  "/api/admin/users/validate-email",
  verifyToken,
  verifyAdmin,
  validateInviteEmail,
);

router.get("/api/admin/users", verifyToken, verifyAdmin, getUsers);
router.post(
  "/api/admin/users",
  verifyToken,
  verifyAdmin,
  upload.single("profilephoto"),
  addUser,
);
router.get("/api/admin/users/:id", verifyToken, verifyAdmin, getUserById);
router.put(
  "/api/admin/users/:id",
  verifyToken,
  verifyAdmin,
  upload.single("profilephoto"),
  updateuser,
);
router.delete("/api/admin/users/:id", verifyToken, verifyAdmin, deleteuser);

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

router.get(
  "/api/admin/analytics/user-growth",
  verifyToken,
  verifyAdmin,
  getUserGrowthAnalytics,
);
router.get("/api/admin/stats", verifyToken, verifyAdmin, getAdminStats);
router.get("/admin/stats", verifyToken, verifyAdmin, getAdminStats);

router.put("/api/admin/users/:id/role", verifyToken, verifyAdmin, makeAdmin);
router.patch(
  "/api/admin/users/:id/status",
  verifyToken,
  verifyAdmin,
  updateUserStatus,
);
router.post(
  "/api/admin/users/:id/revoke-session",
  verifyToken,
  verifyAdmin,
  revokeUserSessions,
);
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

router.post(
  "/api/admin/users/:id/resend-invite",
  verifyToken,
  verifyAdmin,
  emailLimiter,
  resendInvite,
);
router.delete(
  "/api/admin/users/:id/invite",
  verifyToken,
  verifyAdmin,
  cancelInvite,
);

module.exports = router;
