import { getInitials } from "../utils/adminPanelUtils";

export default function AdminActionModals({
  singleAdminModal,
  onCloseSingleAdminModal,
  handleSingleMakeAdminSubmit,

  bulkRoleModal,
  onCloseBulkRoleModal,
  handleBulkRoleChange,

  showModal,
  targetedDeleteUser,
  onCloseSingleDeleteModal,
  handledelete,

  showBulkDeleteModal,
  onCloseBulkDeleteModal,
  handleBulkDelete,

  showImageModal,
  selectedImage,
  onCloseImageModal,

  selectedUserIds,
  modalActionLoading,
}) {
  return (
    <>
      {singleAdminModal.open && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!modalActionLoading) onCloseSingleAdminModal();
          }}
        >
          <div
            className="admin-dialog-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="admin-modal-icon-badge promote">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="admin-modal-title-group">
                <h3>Grant Administrator Access</h3>
                <p>
                  You are about to promote this user to a system administrator.
                </p>
              </div>
            </div>

            {singleAdminModal.user && (
              <div className="admin-modal-user-card">
                <div className="admin-modal-avatar">
                  {singleAdminModal.user.profilePicture ? (
                    <img
                      src={singleAdminModal.user.profilePicture}
                      alt={singleAdminModal.user.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div className="admin-modal-avatar-fallback">
                    {getInitials(singleAdminModal.user.name)}
                  </div>
                </div>
                <div className="admin-modal-user-info">
                  <div className="admin-modal-user-name">
                    {singleAdminModal.user.name}
                  </div>
                  <div className="admin-modal-user-email">
                    {singleAdminModal.user.email}
                  </div>
                </div>
                <div className="admin-modal-role-pill">
                  <span className="role-chip current">User</span>
                  <span className="role-arrow">→</span>
                  <span className="role-chip target-admin">Admin</span>
                </div>
              </div>
            )}

            <div className="admin-modal-callout info">
              <div className="callout-icon">
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="callout-content">
                <strong>Administrative Permissions:</strong> This user will gain
                full privileges to manage accounts, edit user roles, revoke
                active sessions, and configure platform settings.
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn cancel"
                disabled={modalActionLoading}
                onClick={onCloseSingleAdminModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-btn confirm-primary"
                disabled={modalActionLoading}
                onClick={handleSingleMakeAdminSubmit}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Granting Admin Access...</span>
                  </>
                ) : (
                  <>
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
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>Grant Admin Access</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkRoleModal.open && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!modalActionLoading) onCloseBulkRoleModal();
          }}
        >
          <div
            className="admin-dialog-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div
                className={`admin-modal-icon-badge ${bulkRoleModal.targetRole === "admin" ? "promote" : "warning"}`}
              >
                {bulkRoleModal.targetRole === "admin" ? (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                ) : (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="18" y1="8" x2="23" y2="13" />
                    <line x1="23" y1="8" x2="18" y2="13" />
                  </svg>
                )}
              </div>
              <div className="admin-modal-title-group">
                <h3>
                  {bulkRoleModal.targetRole === "admin"
                    ? `Grant Admin Access to ${selectedUserIds.length} User${selectedUserIds.length === 1 ? "" : "s"}?`
                    : `Revoke Admin Access for ${selectedUserIds.length} User${selectedUserIds.length === 1 ? "" : "s"}?`}
                </h3>
                <p>
                  {bulkRoleModal.targetRole === "admin"
                    ? `You are about to promote ${selectedUserIds.length} selected account${selectedUserIds.length === 1 ? "" : "s"} to system administrators.`
                    : `You are about to change ${selectedUserIds.length} selected account${selectedUserIds.length === 1 ? "" : "s"} back to regular user role.`}
                </p>
              </div>
            </div>

            <div className="admin-modal-batch-tag">
              <span className="batch-tag-count">{selectedUserIds.length}</span>
              <span>
                Account{selectedUserIds.length === 1 ? "" : "s"} Selected for
                Role Update
              </span>
            </div>

            <div
              className={`admin-modal-callout ${bulkRoleModal.targetRole === "admin" ? "info" : "warning"}`}
            >
              <div className="callout-icon">
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="callout-content">
                {bulkRoleModal.targetRole === "admin"
                  ? "All selected users will gain full permissions to view and modify platform data, promote users, and manage system operations."
                  : "These users will immediately lose administrative permissions and access to the Admin Panel. Their existing sessions will remain active as regular users."}
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn cancel"
                disabled={modalActionLoading}
                onClick={onCloseBulkRoleModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-modal-btn ${bulkRoleModal.targetRole === "admin" ? "confirm-primary" : "confirm-warning"}`}
                disabled={modalActionLoading}
                onClick={() => handleBulkRoleChange(bulkRoleModal.targetRole)}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Updating Roles...</span>
                  </>
                ) : bulkRoleModal.targetRole === "admin" ? (
                  "Grant Admin Access"
                ) : (
                  "Change to User Role"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!modalActionLoading) onCloseSingleDeleteModal();
          }}
        >
          <div
            className="admin-dialog-modal danger"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="admin-modal-icon-badge delete">
                <svg
                  width="22"
                  height="22"
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
              <div className="admin-modal-title-group">
                <h3>Delete User Account</h3>
                <p>
                  This action is irreversible and will permanently purge this
                  account.
                </p>
              </div>
            </div>

            {targetedDeleteUser && (
              <div className="admin-modal-user-card danger">
                <div className="admin-modal-avatar">
                  {targetedDeleteUser.profilePicture ? (
                    <img
                      src={targetedDeleteUser.profilePicture}
                      alt={targetedDeleteUser.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div className="admin-modal-avatar-fallback danger">
                    {getInitials(targetedDeleteUser.name)}
                  </div>
                </div>
                <div className="admin-modal-user-info">
                  <div className="admin-modal-user-name">
                    {targetedDeleteUser.name}
                  </div>
                  <div className="admin-modal-user-email">
                    {targetedDeleteUser.email}
                  </div>
                </div>
                <span
                  className={`role-chip ${targetedDeleteUser.role === "admin" ? "target-admin" : "current"}`}
                >
                  {targetedDeleteUser.role === "admin" ? "Admin" : "User"}
                </span>
              </div>
            )}

            <div className="admin-modal-callout danger">
              <div className="callout-icon">
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="callout-content">
                <strong>Permanent Removal:</strong> All profile records, active
                devices, sessions, and security credentials for this user will
                be completely erased. This cannot be undone.
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn cancel"
                disabled={modalActionLoading}
                onClick={onCloseSingleDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-btn confirm-danger"
                onClick={handledelete}
                disabled={modalActionLoading}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Deleting User...</span>
                  </>
                ) : (
                  <>
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
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete User Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!modalActionLoading) onCloseBulkDeleteModal();
          }}
        >
          <div
            className="admin-dialog-modal danger"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="admin-modal-icon-badge delete">
                <svg
                  width="22"
                  height="22"
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
              <div className="admin-modal-title-group">
                <h3>
                  Delete {selectedUserIds.length} Selected Account
                  {selectedUserIds.length === 1 ? "" : "s"}?
                </h3>
                <p>
                  This batch action is irreversible and will permanently delete
                  all selected users.
                </p>
              </div>
            </div>

            <div className="admin-modal-batch-tag danger">
              <span className="batch-tag-count">{selectedUserIds.length}</span>
              <span>Accounts Queued for Permanent Deletion</span>
            </div>

            <div className="admin-modal-callout danger">
              <div className="callout-icon">
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="callout-content">
                <strong>Permanent Removal:</strong> All selected accounts, login
                credentials, and stored personal data will be completely erased
                from the database immediately.
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn cancel"
                disabled={modalActionLoading}
                onClick={onCloseBulkDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-btn confirm-danger"
                onClick={handleBulkDelete}
                disabled={modalActionLoading}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Deleting {selectedUserIds.length} Accounts...</span>
                  </>
                ) : (
                  <>
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
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>
                      Delete {selectedUserIds.length} Selected Accounts
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="image-modal" onClick={onCloseImageModal}>
          <img
            className="image-modal-photo"
            src={selectedImage}
            alt="Profile"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
