import { makeAutoObservable, runInAction } from "mobx";
import apirequest from "../api/apirequest";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "x-device-id": localStorage.getItem("deviceId") || "",
});

class NotificationStore {
  notifications = [];
  unreadCount = 0;
  isLoading = false;
  isDropdownOpen = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  setDropdownOpen(value) {
    this.isDropdownOpen = value;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  async fetchNotifications() {
    const token = localStorage.getItem("token");
    if (!token) return;

    this.isLoading = true;
    try {
      const data = await apirequest("/api/notifications", {
        headers: getAuthHeaders(),
      });

      runInAction(() => {
        if (data && data.success) {
          this.notifications = data.notifications || [];
          this.unreadCount = data.unreadCount || 0;
        }
        this.isLoading = false;
      });
    } catch {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async markAsRead(id) {
    // Optimistic update
    const notif = this.notifications.find((n) => n._id === id);
    if (notif && !notif.isRead) {
      notif.isRead = true;
      if (this.unreadCount > 0) this.unreadCount -= 1;
    }

    try {
      const data = await apirequest(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      if (data && typeof data.unreadCount === "number") {
        runInAction(() => {
          this.unreadCount = data.unreadCount;
        });
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  async markAllAsRead() {
    // Optimistic update
    this.notifications.forEach((n) => {
      n.isRead = true;
    });
    this.unreadCount = 0;

    try {
      await apirequest("/api/notifications/read-all", {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      this.fetchNotifications();
    }
  }

  async deleteNotification(id) {
    const prevNotif = this.notifications.find((n) => n._id === id);
    const wasUnread = prevNotif && !prevNotif.isRead;

    // Optimistic removal
    this.notifications = this.notifications.filter((n) => n._id !== id);
    if (wasUnread && this.unreadCount > 0) {
      this.unreadCount -= 1;
    }

    try {
      await apirequest(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      this.fetchNotifications();
    }
  }

  async clearAll() {
    this.notifications = [];
    this.unreadCount = 0;

    try {
      await apirequest("/api/notifications/clear-all", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      this.fetchNotifications();
    }
  }
}

export default NotificationStore;
