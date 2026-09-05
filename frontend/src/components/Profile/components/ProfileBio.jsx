function ProfileBio({ user, loading, onAddBio }) {
  return (
    <div className="profile-section profile-about-section">
      <h3 className="profile-section-title">About Me</h3>

      <div className="bio-card">
        {loading ? (
          <>
            <div className="skeleton skeleton-bio-line"></div>
            <div className="skeleton skeleton-bio-line"></div>
            <div className="skeleton skeleton-bio-line skeleton-bio-short"></div>
          </>
        ) : user?.bio ? (
          <p className="bio-content">{user.bio}</p>
        ) : (
          <div className="bio-empty-wrap">
            <p className="bio-empty" style={{ margin: 0 }}>
              No bio added yet.
            </p>
            {onAddBio && (
              <button
                type="button"
                className="bio-add-btn"
                onClick={onAddBio}
                title="Add Bio"
              >
                + Add Bio
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileBio;
