export default function SettingsDangerTab({ onOpenDeleteModal }) {
  return (
    <div className="setting-section-panel danger-zone">
      <div className="setting-info">
        <div className="setting-info-icon danger">
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
        </div>
        <div>
          <h3>Delete Account</h3>
          <p>
            Permanently delete your account, active sessions, and personal
            data.
          </p>
        </div>
      </div>

      <div className="setting-card danger-card">
        <div className="setting-card-icon alert">
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
        </div>
        <div className="setting-card-content">
          <h4>Delete Account</h4>
          <p>
            Permanently delete your profile, signed-in devices, and personal
            data. Once deleted, this action cannot be undone.
          </p>
        </div>
        <button
          type="button"
          className="btn delete"
          onClick={onOpenDeleteModal}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
