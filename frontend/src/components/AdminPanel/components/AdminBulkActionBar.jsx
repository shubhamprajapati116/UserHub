export default function AdminBulkActionBar({
  selectedUserIds,
  showMakeAdminBtn,
  showMakeUserBtn,
  onOpenBulkRoleModal,
  onOpenBulkDeleteModal,
  onClearSelection,
}) {
  if (selectedUserIds.length === 0) return null;

  return (
    <div className="ul-bulk-toolbar">
      <div className="ul-bulk-info">
        <span className="ul-bulk-badge">{selectedUserIds.length}</span>
        <span className="ul-bulk-text">
          {selectedUserIds.length === 1
            ? "user selected"
            : "users selected"}
        </span>
      </div>
      <div className="ul-bulk-actions">
        {showMakeAdminBtn && (
          <button
            className="btn-bulk-action make-admin"
            onClick={() => onOpenBulkRoleModal("admin")}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
            </svg>
            <span>Make Admin</span>
          </button>
        )}
        {showMakeUserBtn && (
          <button
            className="btn-bulk-action make-user"
            onClick={() => onOpenBulkRoleModal("user")}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Make User</span>
          </button>
        )}
        <button
          className="btn-bulk-action delete"
          onClick={onOpenBulkDeleteModal}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>Delete Selected</span>
        </button>
        <button
          className="btn-bulk-action clear"
          onClick={onClearSelection}
          title="Clear Selection"
        >
          <span>✕ Clear</span>
        </button>
      </div>
    </div>
  );
}
