export default function SettingsSidebarNav({
  activeTab,
  handleTabChange,
  avatarUrl,
  avatarError,
  setAvatarError,
  initials,
  userName,
  currentUser,
}) {
  return (
    <div className="settings-sidebar-nav">
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
          <span
            className={`sidebar-user-role-badge ${currentUser?.role === "admin" ? "admin" : "user"}`}
          >
            {currentUser?.role?.toUpperCase() || "USER"}
          </span>
        </div>
      </div>

      <div className="settings-nav-divider"></div>

      <button
        type="button"
        className={`settings-nav-item ${activeTab === "profile" ? "active" : ""}`}
        onClick={() => handleTabChange("profile")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
        <svg
          width="16"
          height="16"
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
        <span>Security</span>
      </button>

      <button
        type="button"
        className={`settings-nav-item ${activeTab === "appearance" ? "active" : ""}`}
        onClick={() => handleTabChange("appearance")}
      >
        <svg
          width="16"
          height="16"
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
        onClick={() => handleTabChange("notifications")}
      >
        <svg
          width="16"
          height="16"
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
        <span>Email Notifications</span>
      </button>

      <button
        type="button"
        className={`settings-nav-item ${activeTab === "activeSessions" ? "active" : ""}`}
        onClick={() => handleTabChange("activeSessions")}
      >
        <svg
          width="16"
          height="16"
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

      <div className="settings-nav-divider"></div>

      <button
        type="button"
        className={`settings-nav-item danger ${activeTab === "danger" ? "active" : ""}`}
        onClick={() => handleTabChange("danger")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
        <span>Delete Account</span>
      </button>
    </div>
  );
}
