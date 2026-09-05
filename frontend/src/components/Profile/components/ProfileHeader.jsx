function ProfileHeader({
  user,
  loading,
  photoLoading,
  avatarSrc,
  joinedDate,
  percentage,
  showCompletion,
  onShowCompletion,
  onOpenImageModal,
  onPhotoChange,
  onEditProfile,
  fileInputRef,
}) {
  return (
    <div className="profile-header">
      <div className="profile-avatar-wrap">
        {loading ? (
          <div className="skeleton skeleton-profile-avatar"></div>
        ) : (
          <>
            <img
              className="profile-avatar"
              src={avatarSrc}
              alt={user?.name || "Profile"}
              onClick={onOpenImageModal}
            />

            <button
              type="button"
              className="avatar-edit-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile photo"
              title="Change photo"
              disabled={photoLoading}
            >
              {photoLoading ? (
                <svg
                  className="spinner-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ animation: "spin 0.8s linear infinite" }}
                >
                  <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
                  <path d="M12 3a9 9 0 0 1 9 9" strokeOpacity="1" />
                </svg>
              ) : (
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
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPhotoChange}
            />
          </>
        )}
      </div>

      <div className="profile-identity">
        {loading ? (
          <div className="skeleton skeleton-profile-joined"></div>
        ) : (
          <>
            {joinedDate && (
              <p className="profile-joined">
                <svg
                  width="14"
                  height="14"
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
                Joined{" "}
                {joinedDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            {!showCompletion && (
              <button
                type="button"
                className={`profile-completion-mini-badge ${
                  percentage === 100 ? "complete" : ""
                }`}
                onClick={onShowCompletion}
                title="Click to view profile completion details"
              >
                <span className="mini-badge-icon">
                  {percentage === 100 ? "🎉" : "⚡"}
                </span>
                <span className="mini-badge-text">
                  {percentage}% Complete
                </span>
                <span className="mini-badge-arrow">▾</span>
              </button>
            )}
          </>
        )}
      </div>

      <div className="profile-header-actions">
        {loading ? (
          <div className="skeleton skeleton-profile-btn"></div>
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onEditProfile}
          >
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}

export default ProfileHeader;
