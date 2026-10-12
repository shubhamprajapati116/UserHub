export default function SettingsNotificationsTab({
  securityAlerts,
  handleToggleSecurityAlerts,
  loadingPreferences,
  currentUser,
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div className="setting-card-content">
          <h4>
            Security & Login Alerts
            <span className="setting-default-badge">Recommended: ON</span>
          </h4>
          <p>
            Receive an email immediately if your password is changed or if
            someone signs in from a new device.
          </p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={securityAlerts}
            onChange={handleToggleSecurityAlerts}
            disabled={loadingPreferences}
          />
          <span className="slider"></span>
        </label>
      </div>

      <div className="setting-card">
        <div className="setting-card-icon mail">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <div className="setting-card-content">
          <h4>Alert Recipient Address</h4>
          <p>
            All security and account emails will be sent to your verified
            address: <strong>{currentUser?.email}</strong>
          </p>
        </div>
        <span className="setting-status-tag active">Verified</span>
      </div>
    </div>
  );
}
