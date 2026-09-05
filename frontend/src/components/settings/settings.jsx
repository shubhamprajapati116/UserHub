import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import "./settings.css";
import ActiveSessions from "./ActiveSessions";

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
function Settings() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("security");
  const { userStore, themeStore } = useStore();
  const darkMode = themeStore.darkMode;
  const loading = userStore.loading.deleteAccount;

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const handledarkmode = () => {
    themeStore.toggleTheme();
  };

  const securityAlerts =
    userStore.currentUser?.notificationPreferences?.securityLoginAlerts !==
    false;

  const handleToggleSecurityAlerts = async (e) => {
    const newValue = e.target.checked;
    try {
      await userStore.updateNotificationPreferences({
        securityLoginAlerts: newValue,
      });
      toast.success(`Security Alerts ${newValue ? "turned ON" : "turned OFF"}`);
    } catch (error) {
      if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to update notification settings");
      }
    }
  };

  const handleDelete = async () => {
    try {
      const data = await userStore.deleteAccount();
      userStore.clearCurrentUser();
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setShowModal(false);
      toast.success(data.message);
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to delete account");
      }
    }
  };
  return (
    <AppLayout
      title="Settings"
      subtitle="Manage your preferences and account security"
    >
      <div className="settings-option1-container">
        {/* Left Sidebar Navigation */}
        <div className="settings-sidebar-nav">
          <button
            type="button"
            className={`settings-nav-item ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Security</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === "appearance" ? "active" : ""}`}
            onClick={() => setActiveTab("appearance")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <span>Appearance</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Email Notifications</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${
              activeTab === "activeSessions" ? "active" : ""
            }`}
            onClick={() => setActiveTab("activeSessions")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>

            <span>Active Sessions</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item danger ${activeTab === "danger" ? "active" : ""}`}
            onClick={() => setActiveTab("danger")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Right Settings Content Panel */}
        <div className="settings-main-panel">
          {activeTab === "security" && (
            <div className="setting-section-panel">
              <div className="setting-info">
                <div className="setting-info-icon security">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h3>Security Settings</h3>
                  <p>
                    Manage your account password and authentication security.
                  </p>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-card-content">
                  <h4>Password</h4>
                  <p>
                    Change your password regularly to keep your account secure.
                  </p>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => navigate("/settings/change-password")}
                >
                  Change Password
                </button>
              </div>

              {/* Security Advisory Note */}
              <div className="settings-advisory-note info">
                <div className="advisory-note-icon">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="advisory-note-text">
                  <strong>Password Best Practices:</strong> Use at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols for maximum account protection.
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="setting-section-panel">
              <div className="setting-info">
                <div className="setting-info-icon appearance">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </div>
                <div>
                  <h3>Appearance & Theme</h3>
                  <p>Customize your app's visual appearance and color theme.</p>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-card-content">
                  <h4>Dark Mode</h4>
                  <p>Toggle between dark and light color themes.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={handledarkmode}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Appearance Advisory Note */}
              <div className="settings-advisory-note info">
                <div className="advisory-note-icon">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </div>
                <div className="advisory-note-text">
                  <strong>Theme Preference:</strong> Dark mode reduces eye fatigue in low-light environments and preserves battery life on OLED displays.
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="setting-section-panel">
              <div className="setting-info">
                <div className="setting-info-icon security">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h3>Email Notifications</h3>
                  <p>
                    Manage when and how you receive security and app alerts via
                    email.
                  </p>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-card-content">
                  <h4>
                    Security & Login Alerts{" "}
                    <span
                      style={{
                        fontSize: "11px",
                        background: "rgba(37, 99, 235, 0.1)",
                        color: "#2563eb",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        marginLeft: "8px",
                      }}
                    >
                      Default: ON
                    </span>
                  </h4>
                  <p>
                    Receive email alerts whenever your password is changed or a login occurs from a new device.
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={securityAlerts}
                    onChange={handleToggleSecurityAlerts}
                    disabled={userStore.loading.notificationPreferences}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Notifications Advisory Note */}
              <div className="settings-advisory-note info">
                <div className="advisory-note-icon">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div className="advisory-note-text">
                  <strong>Notification Policy:</strong> Critical security alerts (such as password changes and unexpected new logins) are always sent to protect your account.
                </div>
              </div>
            </div>
          )}
          {activeTab === "activeSessions" && <ActiveSessions />}

          {activeTab === "danger" && (
            <div className="setting-section-panel danger-zone">
              <div className="setting-info">
                <div className="setting-info-icon danger">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h3>Danger Zone</h3>
                  <p>
                    Permanent, irreversible actions related to your account.
                  </p>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-card-content">
                  <h4>Delete Account</h4>
                  <p>
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
                <button
                  className="btn delete"
                  onClick={() => setShowModal(true)}
                >
                  Delete Account
                </button>
              </div>

              {/* Danger Zone Advisory Note */}
              <div className="settings-advisory-note danger">
                <div className="advisory-note-icon">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="advisory-note-text">
                  <strong>Irreversible Action:</strong> Account deletion immediately revokes all active sessions and permanently erases your personal profile, timeline, and credentials.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">!</div>
            <h3>Delete your account?</h3>
            <p>
              All your data will be permanently removed. This cannot be undone.
            </p>
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? <><Spinner /> Deleting...</> : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default observer(Settings);
