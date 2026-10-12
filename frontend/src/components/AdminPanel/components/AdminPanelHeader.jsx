export default function AdminPanelHeader({ totalUsers }) {
  return (
    <div className="dashboard-section-header linear-page-header">
      <div className="section-header-left">
        <div className="section-header-icon-box">
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
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="section-header-content">
          <h2 className="section-header-title">User Management</h2>
          <p className="section-header-sub">
            Directory of registered accounts, system roles, and account permissions
          </p>
        </div>
      </div>

      <div className="section-header-right">
        <span className="section-header-badge">
          <span className="section-badge-dot"></span>
          <span className="font-mono">
            {totalUsers} {totalUsers === 1 ? "User" : "Users"}
          </span>
        </span>
      </div>
    </div>
  );
}
