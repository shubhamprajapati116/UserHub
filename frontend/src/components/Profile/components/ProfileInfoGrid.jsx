function ProfileInfoGrid({ loading, profileInfo, onAddField }) {
  return (
    <div className="profile-section profile-info-section">
      <h3 className="profile-section-title">Personal Information</h3>

      <div className="profile-meta">
        {loading
          ? Array.from({ length: 10 }).map((_, index) => (
              <div className="meta-item" key={index}>
                <div className="skeleton skeleton-meta-label"></div>
                <div className="skeleton skeleton-meta-value"></div>
              </div>
            ))
          : profileInfo
              .filter((item) => item.value !== null)
              .map((item) => {
                const isNotAdded =
                  !item.value ||
                  item.value === "Not Added" ||
                  item.value === "First Login";

                return (
                  <div className="meta-item" key={item.label}>
                    <div className="meta-item-header">
                      <div className={`meta-icon ${item.colorClass || ""}`}>
                        {item.icon}
                      </div>
                      <span className="meta-label">{item.label}</span>
                    </div>

                    {item.fieldKey === "email" ? (
                      <div className="meta-email-row">
                        <span className="meta-value email-text" title={item.value}>
                          {item.value}
                        </span>
                        {item.isVerified ? (
                          <span
                            className="email-status-badge verified"
                            title="Verified Email Address"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span
                            className="email-status-badge unverified"
                            title="Email not verified"
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
                            Unverified
                          </span>
                        )}
                      </div>
                    ) : isNotAdded && item.fieldKey && onAddField ? (
                      <div className="meta-value-row">
                        <span className="meta-value not-added">
                          {item.value || "Not Added"}
                        </span>
                        <button
                          type="button"
                          className="meta-add-btn"
                          onClick={() => onAddField(item.fieldKey)}
                          title={`Add ${item.label}`}
                          aria-label={`Add ${item.label}`}
                        >
                          + Add
                        </button>
                      </div>
                    ) : (
                      <span className="meta-value">{item.value}</span>
                    )}
                  </div>
                );
              })}
      </div>
    </div>
  );
}

export default ProfileInfoGrid;
