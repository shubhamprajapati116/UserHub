function ProfileCompletion({ loading, percentage, onHideCompletion }) {
  return (
    <div className="profile-completion-card">
      {loading ? (
        <>
          <div className="completion-header">
            <div>
              <div className="skeleton skeleton-completion-title"></div>
              <div className="skeleton skeleton-completion-subtitle"></div>
            </div>

            <div className="skeleton skeleton-completion-close"></div>
          </div>

          <div className="completion-progress">
            <div className="skeleton skeleton-completion-percentage"></div>

            <div className="completion-bar"></div>
          </div>

          <div className="skeleton skeleton-completion-text"></div>
          <div className="skeleton skeleton-completion-text skeleton-completion-text-short"></div>
        </>
      ) : (
        <>
          <div className="completion-header">
            <div>
              <h3 className="completion-title">Profile Completion</h3>
              <p className="completion-subtitle">
                Keep your profile up to date.
              </p>
            </div>

            <button
              type="button"
              className="completion-close-btn"
              onClick={onHideCompletion}
              title="Minimize checklist"
            >
              ✕
            </button>
          </div>

          <div className="completion-progress">
            <span className="completion-percentage">
              {percentage}% Complete
            </span>

            <div className="completion-bar">
              <div
                className="completion-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <p className="completion-text">
            {percentage === 100
              ? "🎉 Your profile is complete."
              : "Complete your profile to unlock the best experience."}
          </p>
        </>
      )}
    </div>
  );
}

export default ProfileCompletion;
