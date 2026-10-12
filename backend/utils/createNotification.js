const Notification = require("../models/notification");

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
