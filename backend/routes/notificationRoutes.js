const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifytoken");
const { notificationLimiter } = require("../middleware/rateLimiter");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} = require("../controllers/notificationController");

router.get("/api/notifications", verifyToken, notificationLimiter, getNotifications);
router.patch("/api/notifications/:id/read", verifyToken, notificationLimiter, markAsRead);
router.patch("/api/notifications/read-all", verifyToken, notificationLimiter, markAllAsRead);
router.delete("/api/notifications/clear-all", verifyToken, notificationLimiter, clearAllNotifications);
router.delete("/api/notifications/:id", verifyToken, notificationLimiter, deleteNotification);

module.exports = router;
