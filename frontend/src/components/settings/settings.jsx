import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import "./settings.css";
import ActiveSessions from "./ActiveSessions";
import SecurityEmailModal from "../SecurityEmailModal/SecurityEmailModal";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [avatarError, setAvatarError] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const { userStore, themeStore } = useStore();
  const darkMode = themeStore.darkMode;
  const loading = userStore.loading.deleteAccount;
  const currentUser = userStore.currentUser;

  // Sync tab from URL query params or router state
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || location.state?.tab;
    const validTabs = [
      "profile",
      "security",
      "appearance",
      "notifications",
      "activeSessions",
      "danger",
    ];
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, location.state]);

  // Auto-open email change modal if directed from Profile Edit
  useEffect(() => {
    if (location.state?.openEmailModal || searchParams.get("openEmail") === "true") {
      setShowEmailModal(true);
    }
  }, [location.state, searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

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
    currentUser?.notificationPreferences?.securityLoginAlerts !== false;

  const handleToggleSecurityAlerts = async (e) => {
    const newValue = e.target.checked;
    try {
      await userStore.updateNotificationPreferences({
        securityLoginAlerts: newValue,
      });
      toast.success(`Security alerts ${newValue ? "turned ON" : "turned OFF"}`);
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

  const copyToClipboard = (text, keyName, label = "Value") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.info(`Copied ${label} to clipboard!`, { autoClose: 1500 });
    setTimeout(() => {
      setCopiedKey((prev) => (prev === keyName ? null : prev));
    }, 2000);
  };

  // Safe avatar URL handling
  const userPhoto = currentUser?.profilephoto;
  const avatarUrl = userPhoto
    ? userPhoto.startsWith("http")
      ? userPhoto
      : `${import.meta.env.VITE_API_URL}/uploads/${userPhoto}`
    : null;

  const userName = currentUser?.name || "User";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  // Formatted Member Since Date
  const memberSince = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently joined";

  return (
    <AppLayout
      title="Settings"
      subtitle="Manage your personal profile, display theme, and account security"
    >
      <div className="settings-page-wrapper">
        <div className="settings-option1-container">
          {/* ── Left Navigation Sidebar ── */}
          <div className="settings-sidebar-nav">
            {/* Mini User Summary Card */}
            <div
              className={`settings-sidebar-user ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => handleTabChange("profile")}
              role="button"
              tabIndex={0}
              aria-label="View Profile Settings"
            >
              <div className="sidebar-user-avatar">
                {avatarUrl && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="sidebar-avatar-img"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="sidebar-avatar-fallback">{initials}</span>
                )}
                <span className="sidebar-user-status-dot"></span>
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name" title={userName}>
                  {userName}
                </span>
                <span className={`sidebar-user-role-badge ${currentUser?.role === "admin" ? "admin" : "user"}`}>
                  {currentUser?.role?.toUpperCase() || "USER"}
                </span>
              </div>
            </div>

            <div className="settings-nav-divider"></div>

            {/* Navigation Buttons */}
            <button
              type="button"
              className={`settings-nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => handleTabChange("profile")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Profile Overview</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === "security" ? "active" : ""}`}
              onClick={() => handleTabChange("security")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Security</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === "appearance" ? "active" : ""}`}
              onClick={() => handleTabChange("appearance")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              onClick={() => handleTabChange("notifications")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Email Notifications</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === "activeSessions" ? "active" : ""}`}
              onClick={() => handleTabChange("activeSessions")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Active Sessions</span>
            </button>

            <div className="settings-nav-divider"></div>

            <button
              type="button"
              className={`settings-nav-item danger ${activeTab === "danger" ? "active" : ""}`}
              onClick={() => handleTabChange("danger")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Delete Account</span>
            </button>
          </div>

          {/* ── Main Settings Panel ── */}
          <div className="settings-main-panel">
            {/* ═════════ Tab 1: Profile Overview ═════════ */}
            {activeTab === "profile" && (
              <div className="setting-section-panel">
                <div className="setting-info">
                  <div className="setting-info-icon profile">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h3>Account Profile</h3>
                    <p>View your personal details, email status, and account information.</p>
                  </div>
                </div>

                {/* Profile Hero Card */}
                <div className="profile-overview-hero">
                  <div className="profile-hero-left">
                    <div className="profile-hero-avatar-wrap">
                      {avatarUrl && !avatarError ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="profile-hero-avatar"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div className="profile-hero-avatar-fallback">{initials}</div>
                      )}
                      <span className="profile-hero-presence-dot" title="Account Active"></span>
                    </div>

                    <div className="profile-hero-meta">
                      <div className="profile-hero-title-row">
                        <h4 className="profile-hero-name">{userName}</h4>
                        <span className={`profile-badge-role ${currentUser?.role === "admin" ? "admin" : "user"}`}>
                          {currentUser?.role?.toUpperCase() || "USER"}
                        </span>
                        {currentUser?.isVerified !== false && (
                          <span className="profile-badge-verified">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="profile-hero-email">{currentUser?.email || "No email provided"}</p>
                      <span className="profile-hero-since">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Member since {memberSince}
                      </span>
                    </div>
                  </div>

                  <div className="profile-hero-actions">
                    <button
                      type="button"
                      className="btn-profile-edit"
                      onClick={() => navigate("/profile")}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Edit Full Profile</span>
                    </button>
                  </div>
                </div>

                {/* Account Details 2x2 Grid */}
                <div className="profile-details-grid">
                  <div className="profile-detail-card">
                    <div className="detail-card-header">
                      <span className="detail-card-label">User ID</span>
                      <button
                        type="button"
                        className={`detail-copy-btn ${copiedKey === "userId" ? "copied" : ""}`}
                        onClick={() => copyToClipboard(currentUser?._id, "userId", "User ID")}
                        title="Copy User ID"
                      >
                        {copiedKey === "userId" ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <span className="detail-card-val monospace" title={currentUser?._id}>
                      {currentUser?._id ? `${currentUser._id.substring(0, 12)}...` : "N/A"}
                    </span>
                    <span className="detail-card-sub">Your unique account ID number</span>
                  </div>

                  <div className="profile-detail-card">
                    <div className="detail-card-header">
                      <span className="detail-card-label">Email Status</span>
                      <span className="detail-status-pill green">Secure</span>
                    </div>
                    <span className="detail-card-val" title={currentUser?.email}>
                      {currentUser?.email || "N/A"}
                    </span>
                    <span className="detail-card-sub">Used for signing in and account updates</span>
                  </div>

                  <div className="profile-detail-card">
                    <div className="detail-card-header">
                      <span className="detail-card-label">Interface Theme</span>
                    </div>
                    <span className="detail-card-val">
                      {darkMode ? "Dark Theme" : "Light Theme"}
                    </span>
                    <span className="detail-card-sub">Saved automatically for this device</span>
                  </div>

                  <div className="profile-detail-card">
                    <div className="detail-card-header">
                      <span className="detail-card-label">Security Alerts</span>
                      <span className={`detail-status-pill ${securityAlerts ? "blue" : "gray"}`}>
                        {securityAlerts ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <span className="detail-card-val">
                      {securityAlerts ? "Email Alerts Enabled" : "Alerts Turned Off"}
                    </span>
                    <span className="detail-card-sub">Alerts you when a new device signs in</span>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════ Tab 2: Security Settings ═════════ */}
            {activeTab === "security" && (
              <div className="setting-section-panel">
                <div className="setting-info">
                  <div className="setting-info-icon security">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <h3>Security Settings</h3>
                    <p>Keep your account safe by updating your password and reviewing your sign-in protection.</p>
                  </div>
                </div>

                {/* Authentication Method / Overall Protection Card */}
                <div className="setting-card">
                  <div className="setting-card-icon shield">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="setting-card-content">
                    <h4>
                      Sign-In & Data Protection
                      <span className="setting-default-badge green">Encrypted & Safe</span>
                    </h4>
                    <p>Your login and personal information are safely encrypted to keep your account protected at all times.</p>
                  </div>
                  <span className="setting-status-tag active">Active</span>
                </div>

                {/* Email Address Management Card */}
                <div className="setting-card">
                  <div className="setting-card-icon email-sec">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="setting-card-content">
                    <div className="setting-card-header-row">
                      <h4>Account Email Address</h4>
                      <span className="setting-default-badge green">Verified & Primary</span>
                    </div>
                    <p className="setting-card-value-text">
                      <strong>{currentUser?.email || "No email set"}</strong>
                    </p>
                    <p className="setting-card-subtext">
                      Used for logging in, account verification, and receiving critical security alerts.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowEmailModal(true)}
                  >
                    Change Email
                  </button>
                </div>

                {/* Password Management Card */}
                <div className="setting-card">
                  <div className="setting-card-icon key">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                  </div>
                  <div className="setting-card-content">
                    <h4>Account Password</h4>
                    <p>Update your password anytime to keep your account safe from unauthorized access.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => navigate("/settings/change-password")}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* ═════════ Tab 3: Appearance & Theme ═════════ */}
            {activeTab === "appearance" && (
              <div className="setting-section-panel">
                <div className="setting-info">
                  <div className="setting-info-icon appearance">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <p>Choose how UserHub looks on your screen based on what feels comfortable for you.</p>
                  </div>
                </div>

                {/* Interactive Visual Theme Selector (GitHub / Linear Style) */}
                <div className="theme-selector-grid">
                  <div
                    className={`theme-preview-card ${darkMode ? "selected" : ""}`}
                    onClick={() => {
                      if (!darkMode) handledarkmode();
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="theme-preview-box dark">
                      <div className="preview-window">
                        <div className="preview-bar"></div>
                        <div className="preview-content">
                          <div className="preview-line short"></div>
                          <div className="preview-line long"></div>
                        </div>
                      </div>
                    </div>
                    <div className="theme-card-info">
                      <div className="theme-title-row">
                        <span className="theme-name">🌙 Dark Theme</span>
                        {darkMode && <span className="theme-active-tag">Active</span>}
                      </div>
                      <p className="theme-desc">Dark background that is easy on your eyes, especially in low light or at night.</p>
                    </div>
                  </div>

                  <div
                    className={`theme-preview-card ${!darkMode ? "selected" : ""}`}
                    onClick={() => {
                      if (darkMode) handledarkmode();
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="theme-preview-box light">
                      <div className="preview-window">
                        <div className="preview-bar"></div>
                        <div className="preview-content">
                          <div className="preview-line short"></div>
                          <div className="preview-line long"></div>
                        </div>
                      </div>
                    </div>
                    <div className="theme-card-info">
                      <div className="theme-title-row">
                        <span className="theme-name">☀️ Light Theme</span>
                        {!darkMode && <span className="theme-active-tag">Active</span>}
                      </div>
                      <p className="theme-desc">Bright and clean layout with high contrast, ideal for daytime reading.</p>
                    </div>
                  </div>
                </div>

                {/* Quick Toggle Card */}
                <div className="setting-card">
                  <div className="setting-card-icon moon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </div>
                  <div className="setting-card-content">
                    <h4>Dark Mode Toggle</h4>
                    <p>Quickly switch between dark and light mode anytime.</p>
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
              </div>
            )}

            {/* ═════════ Tab 4: Email Notifications ═════════ */}
            {activeTab === "notifications" && (
              <div className="setting-section-panel">
                <div className="setting-info">
                  <div className="setting-info-icon security">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div>
                    <h3>Email Notifications</h3>
                    <p>Manage email updates and security alerts sent to your inbox.</p>
                  </div>
                </div>

                <div className="setting-card">
                  <div className="setting-card-icon bell">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div className="setting-card-content">
                    <h4>
                      Security & Login Alerts
                      <span className="setting-default-badge">Recommended: ON</span>
                    </h4>
                    <p>Receive an email immediately if your password is changed or if someone signs in from a new device.</p>
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

                {/* Delivery Channel Details Card */}
                <div className="setting-card">
                  <div className="setting-card-icon mail">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="setting-card-content">
                    <h4>Alert Recipient Address</h4>
                    <p>All security and account emails will be sent to your verified address: <strong>{currentUser?.email}</strong></p>
                  </div>
                  <span className="setting-status-tag active">Verified</span>
                </div>
              </div>
            )}

            {/* ═════════ Tab 5: Active Sessions ═════════ */}
            {activeTab === "activeSessions" && (
              <ActiveSessions onNavigateSecurity={() => setActiveTab("security")} />
            )}

            {/* ═════════ Tab 6: Delete Account ═════════ */}
            {activeTab === "danger" && (
              <div className="setting-section-panel danger-zone">
                <div className="setting-info">
                  <div className="setting-info-icon danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <h3>Delete Account</h3>
                    <p>Permanently delete your account, active sessions, and personal data.</p>
                  </div>
                </div>

                <div className="setting-card danger-card">
                  <div className="setting-card-icon alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </div>
                  <div className="setting-card-content">
                    <h4>Delete Account</h4>
                    <p>Permanently delete your profile, signed-in devices, and personal data. Once deleted, this action cannot be undone.</p>
                  </div>
                  <button
                    type="button"
                    className="btn delete"
                    onClick={() => setShowModal(true)}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3>Delete your account permanently?</h3>
            <p>
              All your profile details, active sign-ins, and personal data will be permanently deleted. You will not be able to recover this account.
            </p>
            <div className="modal-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
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

      {/* Security Email Change Modal */}
      <SecurityEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </AppLayout>
  );
}

export default observer(Settings);
