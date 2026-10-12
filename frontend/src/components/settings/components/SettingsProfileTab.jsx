export default function SettingsProfileTab({
  currentUser,
  avatarUrl,
  avatarError,
  setAvatarError,
  initials,
  userName,
  memberSince,
  darkMode,
  securityAlerts,
  copiedKey,
  copyToClipboard,
  navigate,
}) {
  return (
    <div className="setting-section-panel">
      <div className="setting-info">
        <div className="setting-info-icon profile">
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
        </div>
        <div>
          <h3>Account Profile</h3>
          <p>
            View your personal details, email status, and account information.
          </p>
        </div>
      </div>

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
            <span
              className="profile-hero-presence-dot"
              title="Account Active"
            ></span>
          </div>

          <div className="profile-hero-meta">
            <div className="profile-hero-title-row">
              <h4 className="profile-hero-name">{userName}</h4>
              <span
                className={`profile-badge-role ${currentUser?.role === "admin" ? "admin" : "user"}`}
              >
                {currentUser?.role?.toUpperCase() || "USER"}
              </span>
              {currentUser?.isVerified !== false && (
                <span className="profile-badge-verified">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <p className="profile-hero-email">
              {currentUser?.email || "No email provided"}
            </p>
            <span className="profile-hero-since">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Edit Full Profile</span>
          </button>
        </div>
      </div>

      <div className="profile-details-grid">
        <div className="profile-detail-card">
          <div className="detail-card-header">
            <span className="detail-card-label">User ID</span>
            <button
              type="button"
              className={`detail-copy-btn ${copiedKey === "userId" ? "copied" : ""}`}
              onClick={() =>
                copyToClipboard(currentUser?._id, "userId", "User ID")
              }
              title="Copy User ID"
            >
              {copiedKey === "userId" ? (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
          <span
            className="detail-card-val monospace"
            title={currentUser?._id}
          >
            {currentUser?._id
              ? `${currentUser._id.substring(0, 12)}...`
              : "N/A"}
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
          <span className="detail-card-sub">
            Used for signing in and account updates
          </span>
        </div>

        <div className="profile-detail-card">
          <div className="detail-card-header">
            <span className="detail-card-label">Interface Theme</span>
          </div>
          <span className="detail-card-val">
            {darkMode ? "Dark Theme" : "Light Theme"}
          </span>
          <span className="detail-card-sub">
            Saved automatically for this device
          </span>
        </div>

        <div className="profile-detail-card">
          <div className="detail-card-header">
            <span className="detail-card-label">Security Alerts</span>
            <span
              className={`detail-status-pill ${securityAlerts ? "blue" : "gray"}`}
            >
              {securityAlerts ? "Active" : "Disabled"}
            </span>
          </div>
          <span className="detail-card-val">
            {securityAlerts ? "Email Alerts Enabled" : "Alerts Turned Off"}
          </span>
          <span className="detail-card-sub">
            Alerts you when a new device signs in
          </span>
        </div>
      </div>
    </div>
  );
}
