function ProfileExperience({
  user,
  loading,
  showAllExp,
  onToggleShowAll,
  onAddExpClick,
  onEditExpClick,
  onDeleteExpClick,
  formatDateStr,
}) {
  return (
    <div className="profile-section profile-exp-section">
      <div className="experience-section-header">
        <h3 className="profile-section-title" style={{ margin: 0 }}>
          Work Experience
        </h3>
        <button
          type="button"
          className="add-exp-btn"
          onClick={onAddExpClick}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Experience
        </button>
      </div>

      <div className="timeline-container">
        {loading ? (
          Array.from({ length: 1 }).map((_, idx) => (
            <div
              className="experience-card apple-card-style skeleton-exp-card"
              key={idx}
              style={{ opacity: 0.7 }}
            >
              <div className="apple-card-header">
                <div
                  className="skeleton skeleton-avatar"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "7px",
                    flexShrink: 0,
                  }}
                ></div>

                <div
                  className="apple-title-group"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div
                    className="skeleton skeleton-line"
                    style={{ width: "50%", height: "14px" }}
                  ></div>
                  <div
                    className="skeleton skeleton-line"
                    style={{ width: "30%", height: "11px" }}
                  ></div>
                  <div
                    className="skeleton skeleton-badge"
                    style={{
                      width: "140px",
                      height: "18px",
                      borderRadius: "999px",
                      marginTop: "2px",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        ) : user?.experience && user.experience.length > 0 ? (
          <>
            {(showAllExp
              ? user.experience
              : user.experience.slice(0, 1)
            ).map((exp) => {
              const companyInitial = exp.company
                ? exp.company.charAt(0).toUpperCase()
                : "A";
              const cleanDesc = exp.description
                ? exp.description.replace(/^\/\/\s*/, "").trim()
                : "";
              return (
                <div
                  className="experience-card apple-card-style"
                  key={exp._id}
                >
                  {/* Top Header Row - Clean Balanced Layout */}
                  <div className="apple-card-header">
                    <div className="apple-card-header-top">
                      <div className="apple-header-left">
                        <div className="apple-company-logo">
                          <span>{companyInitial}</span>
                        </div>

                        <div className="apple-title-group">
                          <div className="apple-title-row">
                            <h4 className="apple-job-title">
                              {exp.title}
                            </h4>
                            <span className="apple-company-sep">@</span>
                            <span className="apple-company-name">
                              {exp.company}
                            </span>
                            {exp.location && (
                              <span className="apple-company-loc">
                                ({exp.location})
                              </span>
                            )}
                          </div>

                          <div className="apple-blue-pill">
                            {formatDateStr(exp.startDate).toUpperCase()}{" "}
                            —{" "}
                            {exp.isCurrent
                              ? "PRESENT"
                              : formatDateStr(
                                  exp.endDate,
                                ).toUpperCase()}{" "}
                            {exp.employmentType
                              ? `• ${exp.employmentType.toUpperCase()}`
                              : ""}
                          </div>
                        </div>
                      </div>

                      <div className="experience-actions">
                        <button
                          type="button"
                          className="exp-action-btn edit"
                          onClick={() => onEditExpClick(exp)}
                          title="Edit Experience"
                          aria-label="Edit Experience"
                        >
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
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="exp-action-btn delete"
                          onClick={() => onDeleteExpClick(exp)}
                          title="Delete Experience"
                          aria-label="Delete Experience"
                        >
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
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bullet Description Section */}
                  {cleanDesc && cleanDesc !== "//" && (
                    <div className="apple-card-body">
                      <div className="exp-desc-divider"></div>
                      <div className="apple-bullet-list">
                        {cleanDesc.split("\n").map((line, lIdx) => {
                          const bulletLine = line
                            // eslint-disable-next-line no-useless-escape
                            .replace(/^[•\-\*]\s*/, "")
                            .trim();
                          if (!bulletLine) return null;
                          return (
                            <div
                              className="apple-bullet-item"
                              key={lIdx}
                            >
                              <span className="apple-bullet-dot">
                                •
                              </span>
                              <span>{bulletLine}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {user?.experience && user.experience.length > 1 && (
              <div style={{ textAlign: "center", marginTop: "4px" }}>
                <button
                  type="button"
                  className="add-exp-btn"
                  onClick={onToggleShowAll}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                    margin: "0 auto",
                    display: "inline-flex",
                  }}
                >
                  {showAllExp
                    ? "▲ Show Less"
                    : `▼ View All (${user.experience.length - 1} More)`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="experience-empty">
            <p>No work experience added yet.</p>
            <button
              type="button"
              className="add-exp-btn"
              style={{ marginTop: "12px" }}
              onClick={onAddExpClick}
            >
              + Add Experience
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileExperience;
