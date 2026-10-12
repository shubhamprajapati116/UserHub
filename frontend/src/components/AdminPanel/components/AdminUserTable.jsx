import {
  getInitials,
  getInitialsColorClass,
  formatDob,
  formatLastActive,
  formatFullDateTime,
  isPlaceholderPhoto,
} from "../utils/adminPanelUtils";

export default function AdminUserTable({
  loading,
  users,
  showTableLoader,
  isAllSelected,
  toggleSelectAll,
  handleSort,
  sortBy,
  sortOrder,
  role,
  selectedUserIds,
  currentUserId,
  toggleSelectUser,
  setSelectedImage,
  setShowImageModal,
  menuState,
  setMenuState,
  visibleColumns = { role: true, gender: true, status: true, lastActive: true, dob: true },
}) {
  if (!loading && users.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <p>No users found</p>
        <span>Try a different search term or reset your filters</span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      {showTableLoader && (
        <div className="table-loading-overlay">
          <div className="table-spinner"></div>
          <span>Updating user list...</span>
        </div>
      )}
      <table
        className={`linear-table col-count-${
          Object.values(visibleColumns).filter(Boolean).length
        } ${
          Object.values(visibleColumns).filter(Boolean).length === 1
            ? "single-column-active"
            : ""
        }`}
      >
        <thead>
          <tr>
            <th className="th-checkbox">
              <input
                type="checkbox"
                className="ul-checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                aria-label="Select all users"
              />
            </th>
            <th className="th-profile">User</th>
            {visibleColumns.role && <th className="th-role">Role</th>}
            {visibleColumns.gender && <th className="th-gender">Gender</th>}
            {visibleColumns.status && <th className="th-status">Status</th>}
            {visibleColumns.lastActive && (
              <th
                className="th-last-active th-sortable"
                onClick={() => handleSort("lastLogin")}
                title="Sort by Last Active"
              >
                <div className="last-active-header-cell">
                  <span className="last-active-full-text">Last Active</span>
                  <span className="last-active-short-text">Active</span>
                  <span
                    className={`last-active-arrow-wrap ${
                      sortBy === "lastLogin" ? "active" : ""
                    }`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {sortBy === "lastLogin" ? (
                        sortOrder === "asc" ? (
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        ) : (
                          <path d="M12 5v14M5 12l7 7 7-7" />
                        )
                      ) : (
                        <path d="M7 9l5-5 5 5M7 15l5 5 5-5" />
                      )}
                    </svg>
                  </span>
                </div>
              </th>
            )}
            {visibleColumns.dob && (
              <th
                className="th-dob th-sortable"
                onClick={() => handleSort("dob")}
                title="Sort by Date of Birth"
              >
                <div className="dob-header-cell">
                  <span className="dob-full-text">Date of Birth</span>
                  <span className="dob-short-text">DOB</span>
                  <span
                    className={`dob-arrow-wrap ${
                      sortBy === "dob" ? "active" : ""
                    }`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {sortBy === "dob" ? (
                        sortOrder === "asc" ? (
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        ) : (
                          <path d="M12 5v14M5 12l7 7 7-7" />
                        )
                      ) : (
                        <path d="M7 9l5-5 5 5M7 15l5 5 5-5" />
                      )}
                    </svg>
                  </span>
                </div>
              </th>
            )}
            {role === "admin" && (
              <th className="th-actions">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="td-checkbox">
                    <div className="skeleton skeleton-checkbox"></div>
                  </td>
                  <td className="td-profile">
                    <div className="user-profile-cell">
                      <div className="skeleton skeleton-user-avatar"></div>
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <div className="skeleton skeleton-user-name"></div>
                        <div className="skeleton skeleton-user-email"></div>
                      </div>
                    </div>
                  </td>
                  {visibleColumns.role && (
                    <td className="td-role">
                      <div className="skeleton skeleton-user-role"></div>
                    </td>
                  )}
                  {visibleColumns.gender && (
                    <td className="td-gender">
                      <div className="skeleton skeleton-user-small"></div>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="td-status">
                      <div className="skeleton skeleton-user-small"></div>
                    </td>
                  )}
                  {visibleColumns.lastActive && (
                    <td className="td-last-active">
                      <div className="skeleton skeleton-user-date"></div>
                    </td>
                  )}
                  {visibleColumns.dob && (
                    <td className="td-dob">
                      <div className="skeleton skeleton-user-date"></div>
                    </td>
                  )}
                  {role === "admin" && (
                    <td className="td-actions">
                      <div className="skeleton skeleton-user-action"></div>
                    </td>
                  )}
                </tr>
              ))
            : users.map((user) => {
                const isSelf = user._id === currentUserId;
                return (
                  <tr
                    key={user._id}
                    className={`linear-row ${
                      selectedUserIds.includes(user._id)
                        ? "row-selected"
                        : ""
                    } ${user.role === "admin" ? "row-admin" : ""} ${
                      user.status === "suspended"
                        ? "row-suspended"
                        : user.status === "banned"
                          ? "row-banned"
                          : ""
                    } ${isSelf ? "row-self" : ""}`}
                  >
                    <td className="td-checkbox">
                      <input
                        type="checkbox"
                        className="ul-checkbox"
                        checked={selectedUserIds.includes(user._id)}
                        disabled={isSelf}
                        title={
                          isSelf
                            ? "You cannot select your own account for batch actions"
                            : "Select user"
                        }
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectUser(user._id, e);
                        }}
                      />
                    </td>
                    <td className="td-profile">
                      <div className="user-profile-cell">
                        <div className="linear-avatar-wrap">
                          {(user.profilephoto || user.profileImage) &&
                          !isPlaceholderPhoto(
                            user.profilephoto || user.profileImage,
                          ) ? (
                            <img
                              src={
                                user.profileImage ||
                                `${import.meta.env.VITE_API_URL}/uploads/${user.profilephoto}`
                              }
                              alt={user.name}
                              className={`profile-avatar-img ${
                                user.status === "banned"
                                  ? "avatar-ring-banned"
                                  : user.status === "suspended"
                                    ? "avatar-ring-suspended"
                                    : user.role === "admin"
                                      ? "avatar-ring-admin"
                                      : "avatar-ring-user"
                              }`}
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";
                                const fb =
                                  e.currentTarget.nextElementSibling;
                                if (fb)
                                  fb.style.display = "inline-flex";
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const photo =
                                  user.profileImage ||
                                  user.profilephoto;
                                if (!photo) return;
                                setSelectedImage(
                                  user.profileImage ||
                                    `${import.meta.env.VITE_API_URL}/uploads/${user.profilephoto}`,
                                );
                                setShowImageModal(true);
                              }}
                            />
                          ) : null}
                          <div
                            className={`profile-initials-avatar ${getInitialsColorClass(user.name)}`}
                            style={{
                              display:
                                (user.profilephoto ||
                                  user.profileImage) &&
                                !isPlaceholderPhoto(
                                  user.profilephoto ||
                                    user.profileImage,
                                )
                                  ? "none"
                                  : "inline-flex",
                            }}
                            title={user.name}
                            onClick={(e) => {
                              const photo =
                                user.profileImage ||
                                user.profilephoto;
                              if (
                                photo &&
                                !isPlaceholderPhoto(photo)
                              ) {
                                e.stopPropagation();
                                setSelectedImage(
                                  user.profileImage ||
                                    `${import.meta.env.VITE_API_URL}/uploads/${user.profilephoto}`,
                                );
                                setShowImageModal(true);
                              }
                            }}
                          >
                            {getInitials(user.name)}
                          </div>
                        </div>
                        <div className="profile-meta-wrap">
                          <div className="profile-name-row">
                            <span className="profile-name">
                              {user.name}
                            </span>
                            {isSelf && (
                              <span className="linear-you-badge">
                                You
                              </span>
                            )}
                          </div>
                          <div className="profile-email-wrap">
                            <span className="profile-email font-mono">
                              {user.email}
                            </span>
                            {user.inviteStatus === "pending" ? (
                              user.inviteDeliveryStatus === "failed" ? (
                                <span
                                  className="email-status-pill delivery-failed"
                                  title={`Email delivery failed: ${user.inviteDeliveryError || "SMTP error"}. Click Resend in actions menu.`}
                                >
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                  </svg>
                                  <span>Delivery Failed</span>
                                </span>
                              ) : user.inviteTokenExpire && new Date(user.inviteTokenExpire) < new Date() ? (
                                <span
                                  className="email-status-pill invite-expired"
                                  title="Invitation link expired after 7 days. Click Resend in actions menu to issue a new link."
                                >
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span>Invite Expired</span>
                                </span>
                              ) : (
                                <span
                                  className="email-status-pill invite-pending"
                                  title={`Invitation dispatched. Expires in ${Math.max(
                                    1,
                                    Math.ceil(
                                      (new Date(user.inviteTokenExpire) -
                                        Date.now()) /
                                        (24 * 60 * 60 * 1000),
                                    ),
                                  )} day(s). Account activates upon user setting password.`}
                                >
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span>Invite Pending</span>
                                </span>
                              )
                            ) : user.isVerified ? (
                              <span
                                className="email-status-pill verified"
                                title="Email Verified"
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span
                                className="email-status-pill unverified"
                                title="Email verification pending."
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line
                                    x1="12"
                                    y1="8"
                                    x2="12"
                                    y2="12"
                                  />
                                  <line
                                    x1="12"
                                    y1="16"
                                    x2="12.01"
                                    y2="16"
                                  />
                                </svg>
                                <span>Unverified</span>
                              </span>
                            )}
                          </div>
                          {user.pendingEmail && (
                            <div
                              className="profile-pending-email-badge"
                              title={`Pending email change to ${user.pendingEmail}. Verification link sent.`}
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>
                                Pending: {user.pendingEmail}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {visibleColumns.role && (
                      <td className="td-role">
                        {user.role === "admin" ? (
                          <span className="linear-badge-admin">
                            <svg
                              className="badge-svg-icon"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                            </svg>
                            <span>Admin</span>
                          </span>
                        ) : (
                          <span className="linear-badge-user">
                            <svg
                              className="badge-svg-icon"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>User</span>
                          </span>
                        )}
                      </td>
                    )}

                    {visibleColumns.gender && (
                      <td className="td-gender">
                        {user.gender ? (
                          <span
                            className={`linear-badge-gender ${user.gender.toLowerCase()}`}
                          >
                            {user.gender.toLowerCase() === "male" ? (
                              <svg
                                className="gender-svg-icon"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="10" cy="14" r="5" />
                                <line
                                  x1="19"
                                  y1="5"
                                  x2="13.6"
                                  y2="10.4"
                                />
                                <polyline points="15 5 19 5 19 9" />
                              </svg>
                            ) : user.gender.toLowerCase() ===
                              "female" ? (
                              <svg
                                className="gender-svg-icon"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="9" r="5" />
                                <line x1="12" y1="14" x2="12" y2="21" />
                                <line x1="9" y1="18" x2="15" y2="18" />
                              </svg>
                            ) : (
                              <svg
                                className="gender-svg-icon"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="2" x2="12" y2="7" />
                                <line x1="12" y1="17" x2="12" y2="22" />
                              </svg>
                            )}
                            <span>
                              {user.gender.charAt(0).toUpperCase() +
                                user.gender.slice(1).toLowerCase()}
                            </span>
                          </span>
                        ) : (
                          <span className="linear-badge-gender none">
                            —
                          </span>
                        )}
                      </td>
                    )}

                    {visibleColumns.status && (
                      <td className="td-status">
                        {user.status === "banned" ? (
                          <span
                            className="linear-status-badge banned"
                            title={
                              user.statusReason
                                ? `Banned: ${user.statusReason}`
                                : "Account is permanently banned"
                            }
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line
                                x1="4.93"
                                y1="4.93"
                                x2="19.07"
                                y2="19.07"
                              />
                            </svg>
                            <span>Banned</span>
                          </span>
                        ) : user.status === "suspended" ? (
                          <span
                            className="linear-status-badge suspended"
                            title={
                              user.statusReason
                                ? `Suspended: ${user.statusReason}`
                                : "Account is temporarily suspended"
                            }
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="10" y1="15" x2="10" y2="9" />
                              <line x1="14" y1="15" x2="14" y2="9" />
                            </svg>
                            <span>Suspended</span>
                          </span>
                        ) : (
                          <span
                            className="linear-status-badge active"
                            title="Account is active and operational"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                    )}

                    {visibleColumns.lastActive && (
                      <td className="td-last-active font-mono">
                        {(() => {
                          const activeData = formatLastActive(
                            user.lastLogin,
                            user.isOnline,
                          );
                          return (
                            <div
                              className={`last-active-pill ${
                                activeData.isOnline
                                  ? "online"
                                  : activeData.isNever
                                    ? "never"
                                    : "recent"
                              }`}
                              title={`Last active: ${formatFullDateTime(user.lastLogin)}`}
                            >
                              {activeData.isOnline ? (
                                <span className="online-indicator-dot" />
                              ) : !activeData.isNever ? (
                                <svg
                                  className="last-active-clock-icon"
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                              ) : null}
                              <span className="last-active-text full">
                                {activeData.text}
                              </span>
                              <span className="last-active-text short">
                                {activeData.shortText}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                    )}

                    {visibleColumns.dob && (
                      <td className="td-dob font-mono">
                        <div className="dob-pill">
                          <svg
                            className="dob-calendar-icon"
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{formatDob(user.dob)}</span>
                        </div>
                      </td>
                    )}

                    {role === "admin" && (
                      <td className="td-actions">
                        <button
                          className={`linear-action-btn ${
                            menuState.open &&
                            menuState.user?._id === user._id
                              ? "active"
                              : ""
                          }`}
                          title="User actions"
                          aria-label="User actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              menuState.open &&
                              menuState.user?._id === user._id
                            ) {
                              setMenuState({
                                open: false,
                                user: null,
                                reference: null,
                              });
                              return;
                            }
                            setMenuState({
                              open: true,
                              user,
                              reference: e.currentTarget,
                            });
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                            <circle cx="5" cy="12" r="2" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
