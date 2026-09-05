const Notification = require("../models/notification");

/**
 * Builds a query filter for notifications.
 * Excludes security_login alerts that originated from the CURRENT active session or device,
 * ensuring the hacker/unknown device cannot see alerts about their own login,
 * while all legitimate devices of the real user receive the security alert.
 */
const getSessionNotificationFilter = (userId, currentSessionId, currentDeviceId) => {
  const excludeClauses = [];
  if (currentSessionId) {
    excludeClauses.push({ "metadata.sourceSessionId": currentSessionId });
  }
  if (currentDeviceId) {
    excludeClauses.push({ "metadata.sourceDeviceId": currentDeviceId });
  }

  if (excludeClauses.length > 0) {
    return {
      userId,
      $or: [
        { type: { $ne: "security_login" } },
        { $nor: excludeClauses },
      ],
    };
  }

  return { userId };
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentSessionId = req.user.sessionId;
    const currentDeviceId = req.headers["x-device-id"];
    const filter = getSessionNotificationFilter(userId, currentSessionId, currentDeviceId);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const filter = getSessionNotificationFilter(req.user.id, req.user.sessionId, req.headers["x-device-id"]);
    await Notification.updateMany(
      { ...filter, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = getSessionNotificationFilter(req.user.id, req.user.sessionId, req.headers["x-device-id"]);
    const deleted = await Notification.findOneAndDelete({
      _id: id,
      ...filter,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const clearAllNotifications = async (req, res) => {
  try {
    const filter = getSessionNotificationFilter(req.user.id, req.user.sessionId, req.headers["x-device-id"]);
    await Notification.deleteMany(filter);

    return res.status(200).json({
      success: true,
      message: "All notifications cleared",
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
