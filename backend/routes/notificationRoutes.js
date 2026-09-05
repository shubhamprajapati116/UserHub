const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifytoken");
const { userApiLimiter } = require("../middleware/rateLimiter");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} = require("../controllers/notificationController");

router.get("/notifications", verifyToken, userApiLimiter, getNotifications);
router.get("/api/notifications", verifyToken, userApiLimiter, getNotifications);

router.patch("/notifications/:id/read", verifyToken, userApiLimiter, markAsRead);
router.patch("/api/notifications/:id/read", verifyToken, userApiLimiter, markAsRead);

router.patch("/notifications/read-all", verifyToken, userApiLimiter, markAllAsRead);
router.patch("/api/notifications/read-all", verifyToken, userApiLimiter, markAllAsRead);

router.delete("/notifications/clear-all", verifyToken, userApiLimiter, clearAllNotifications);
router.delete("/api/notifications/clear-all", verifyToken, userApiLimiter, clearAllNotifications);

router.delete("/notifications/:id", verifyToken, userApiLimiter, deleteNotification);
router.delete("/api/notifications/:id", verifyToken, userApiLimiter, deleteNotification);

module.exports = router;
