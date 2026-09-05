const Notification = require("../models/notification");

/**
 * Creates an in-app notification for a user.
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.userId
 * @param {string} params.type - 'security_login' | 'role_update' | 'password_change'
 * @param {string} params.title
 * @param {string} params.message
 * @param {Object} [params.metadata]
 */
const createNotification = async ({ userId, type, title, message, metadata = {} }) => {
  try {
    if (!userId || !type || !message) return null;
    const notification = await Notification.create({
      userId,
      type,
      title: title || "Notification",
      message,
      metadata,
    });
    return notification;
  } catch (error) {
    console.error("❌ Failed to create in-app notification:", error.message);
    return null;
  }
};

module.exports = createNotification;
