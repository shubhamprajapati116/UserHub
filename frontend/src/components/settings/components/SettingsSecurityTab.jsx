export default function SettingsSecurityTab({
  currentUser,
  setShowEmailModal,
  navigate,
}) {
  return (
    <div className="setting-section-panel">
      <div className="setting-info">
        <div className="setting-info-icon security">
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
        </div>
        <div>
          <h3>Security Settings</h3>
          <p>
            Keep your account safe by updating your password and reviewing your
            sign-in protection.
          </p>
        </div>
      </div>

      <div className="setting-card">
        <div className="setting-card-icon shield">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="setting-card-content">
          <h4>
            Sign-In & Data Protection
            <span className="setting-default-badge green">
              Encrypted & Safe
            </span>
          </h4>
          <p>
            Your login and personal information are safely encrypted to keep
            your account protected at all times.
          </p>
        </div>
        <span className="setting-status-tag active">Active</span>
      </div>

      <div className="setting-card">
        <div className="setting-card-icon email-sec">
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
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <div className="setting-card-content">
          <div className="setting-card-header-row">
            <h4>Account Email Address</h4>
            <span className="setting-default-badge green">
              Verified & Primary
            </span>
          </div>
          <p className="setting-card-value-text">
            <strong>{currentUser?.email || "No email set"}</strong>
          </p>
          <p className="setting-card-subtext">
            Used for logging in, account verification, and receiving critical
            security alerts.
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

      <div className="setting-card">
        <div className="setting-card-icon key">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </div>
        <div className="setting-card-content">
          <h4>Account Password</h4>
          <p>
            Update your password anytime to keep your account safe from
            unauthorized access.
          </p>
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
  );
}
