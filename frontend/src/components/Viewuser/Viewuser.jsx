/* eslint-disable react-refresh/only-export-components */
import "./ViewUser.css";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import AppLayout from "../../components/AppLayout/AppLayout";
import "../Experience/experience.css";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUserTag,
  FaCheckCircle,
  FaVenusMars,
  FaBirthdayCake,
  FaGlobe,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaEdit,
} from "react-icons/fa";

function ViewUser() {
  const { id } = useParams();

  const { userStore } = useStore();

  const [isExpOpen, setIsExpOpen] = useState(false);

  useEffect(() => {
    userStore.fetchUserById(id);
  }, [id, userStore]);

  const user = userStore.editUser || {};
  const loading = userStore.loading.fetchUserById || false;

  const safeFormatDate = (dateVal, options = {}) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-IN", options);
    } catch {
      return "N/A";
    }
  };

  const safeFormatDateTime = (dateVal, options = {}) => {
    if (!dateVal) return "Never";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "Never";
      return d.toLocaleString("en-IN", options);
    } catch {
      return "Never";
    }
  };

  const formatDateStr = (dateVal) => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <AppLayout
      title="User Details"
      breadcrumbs={[
        { label: "Admin Panel", path: "/admin/users" },
        { label: "Users", path: "/admin/users" },
        { label: user.name || "User Details" },
      ]}
    >
      <div className="userview-page">
        <div className="userview-container">
          <div className="userview-header">
            <div className="userview-image">
              {loading ? (
                <div className="skeleton skeleton-avatar"></div>
              ) : (
                <img
                  src={
                    user.profilephoto
                      ? `${import.meta.env.VITE_API_URL}/uploads/${user.profilephoto}`
                      : "https://ui-avatars.com/api/?name=User"
                  }
                  alt={user.name}
                  onError={(e) => {
                    e.target.src = "https://ui-avatars.com/api/?name=User";
                  }}
                />
              )}
            </div>

            <h2 className="userview-name">
              {loading ? (
                <div className="skeleton skeleton-name"></div>
              ) : (
                user.name
              )}
            </h2>

            <div className="userview-badges">
              {loading ? (
                <>
                  <div className="skeleton skeleton-badge"></div>
                  <div className="skeleton skeleton-badge"></div>
                </>
              ) : (
                <>
                  {user.isVerified && (
                    <span className="badge verified-badge">
                      <FaCheckCircle />
                      Verified
                    </span>
                  )}

                  {user.createdAt ? (
                    <span className="badge joined-badge">
                      <FaCalendarAlt />
                      Joined{" "}
                      {safeFormatDate(user.createdAt, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="userview-info-section">
            {/* Left */}
            <div className="userview-card">
              <h3>Account Information</h3>

              <div className="userview-grid">
                {/* Name */}
                <div className="userview-item">
                  <FaUser />
                  <div>
                    <span>Name</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user.name
                      )}
                    </strong>
                  </div>
                </div>

                {/* Email */}
                <div className="userview-item">
                  <FaEnvelope />
                  <div>
                    <span>Email</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value skeleton-email"></div>
                      ) : (
                        user.email
                      )}
                    </strong>
                  </div>
                </div>

                {/* Phone */}
                <div className="userview-item">
                  <FaPhone />
                  <div>
                    <span>Phone</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user.phone || "Not Added"
                      )}
                    </strong>
                  </div>
                </div>

                {/* Role */}
                <div className="userview-item">
                  <FaUserTag />
                  <div>
                    <span>Role</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-small"></div>
                      ) : user.role ? (
                        user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      ) : (
                        "User"
                      )}
                    </strong>
                  </div>
                </div>

                {/* Status */}
                <div className="userview-item">
                  <FaCheckCircle />
                  <div>
                    <span>Status</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-small"></div>
                      ) : user.isVerified ? (
                        "Verified"
                      ) : (
                        "Not Verified"
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="userview-card">
              <h3>Personal Information</h3>

              <div className="userview-grid">
                {/* Gender */}
                <div className="userview-item">
                  <FaVenusMars />
                  <div>
                    <span>Gender</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-small"></div>
                      ) : (
                        user.gender || "Not Added"
                      )}
                    </strong>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="userview-item">
                  <FaBirthdayCake />
                  <div>
                    <span>Date of Birth</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : user.dob ? (
                        safeFormatDate(user.dob)
                      ) : (
                        "Not Added"
                      )}
                    </strong>
                  </div>
                </div>

                {/* Country */}
                <div className="userview-item">
                  <FaGlobe />
                  <div>
                    <span>Country</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user.country || "Not Added"
                      )}
                    </strong>
                  </div>
                </div>

                {/* State */}
                <div className="userview-item">
                  <FaMapMarkerAlt />
                  <div>
                    <span>State</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user.state || "Not Added"
                      )}
                    </strong>
                  </div>
                </div>

                {/* City */}
                <div className="userview-item">
                  <FaMapMarkerAlt />
                  <div>
                    <span>City</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user.city || "Not Added"
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="userview-card">
            <h3>About Me</h3>

            <div className="userview-about">
              {loading ? (
                <div className="skeleton-bio">
                  <div className="skeleton skeleton-line"></div>

                  <div className="skeleton skeleton-line"></div>

                  <div className="skeleton skeleton-line short"></div>
                </div>
              ) : user.bio ? (
                <p className="userview-bio">{user.bio}</p>
              ) : (
                <p className="empty-bio">This user hasn't added a bio yet.</p>
              )}
            </div>
          </div>

          <div className="userview-card">
            <div
              className="experience-toggle-header"
              onClick={() => setIsExpOpen(!isExpOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <h3 style={{ margin: 0 }}>Work Experience</h3>
                <span className="experience-badge">
                  {user?.experience ? user.experience.length : 0}{" "}
                  {user?.experience?.length === 1 ? "Role" : "Roles"}
                </span>
              </div>

              <button
                type="button"
                className="add-exp-btn"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              >
                {isExpOpen ? "▲ Hide" : "▼ View"}
              </button>
            </div>{" "}
            {isExpOpen && (
              <div className="timeline-container" style={{ marginTop: "18px" }}>
                {loading ? (
                  Array.from({ length: 2 }).map((_, idx) => (
                    <div
                      className="experience-card apple-card-style skeleton-exp-card"
                      key={idx}
                      style={{ opacity: 0.7 }}
                    >
                      <div className="apple-card-header">
                        <div
                          className="skeleton skeleton-avatar"
                          style={{
                            width: "46px",
                            height: "46px",
                            borderRadius: "12px",
                            flexShrink: 0,
                          }}
                        ></div>

                        <div
                          className="apple-title-group"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div
                            className="skeleton skeleton-line"
                            style={{ width: "55%", height: "18px" }}
                          ></div>
                          <div
                            className="skeleton skeleton-line"
                            style={{ width: "35%", height: "14px" }}
                          ></div>
                          <div
                            className="skeleton skeleton-badge"
                            style={{
                              width: "180px",
                              height: "22px",
                              borderRadius: "999px",
                              marginTop: "4px",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : user?.experience && user.experience.length > 0 ? (
                  user.experience.map((exp) => {
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
                        {/* Top Header Row */}
                        <div className="apple-card-header">
                          <div className="apple-company-logo">
                            <span>{companyInitial}</span>
                          </div>

                          <div className="apple-title-group">
                            <h3 className="apple-job-title">{exp.title}</h3>
                            <div className="apple-company-sub">
                              {exp.company}{" "}
                              {exp.location ? `— ${exp.location}` : ""}
                            </div>
                            <div className="apple-blue-pill">
                              {formatDateStr(exp.startDate).toUpperCase()} —{" "}
                              {exp.isCurrent
                                ? "PRESENT"
                                : formatDateStr(exp.endDate).toUpperCase()}{" "}
                              {exp.employmentType
                                ? `• ${exp.employmentType.toUpperCase()}`
                                : ""}
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
                                  .replace(/^[•\-\\*]\s*/, "")
                                  .trim();
                                if (!bulletLine) return null;
                                return (
                                  <div className="apple-bullet-item" key={lIdx}>
                                    <span className="apple-bullet-dot">•</span>
                                    <span>{bulletLine}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="experience-empty">
                    <p>No work experience added by this user yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="userview-bottom-section">
            <div className="userview-card">
              <h3>System Information</h3>

              <div className="userview-grid">
                <div className="userview-item">
                  <FaCalendarAlt />
                  <div>
                    <span>Joined Date</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        safeFormatDate(user.createdAt, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      )}
                    </strong>
                  </div>
                </div>

                <div className="userview-item">
                  <FaClock />
                  <div>
                    <span>Last Login</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        safeFormatDateTime(user.lastLogin, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="userview-button-group">
            {loading ? (
              <>
                <div className="skeleton skeleton-btn"></div>

                <div className="skeleton skeleton-btn"></div>
              </>
            ) : (
              <>
                <Link to="/admin/users" className="userview-back-btn">
                  Back
                </Link>

                <Link
                  to={`/admin/users/${user._id}/edit`}
                  className="userview-edit-btn"
                >
                  <FaEdit />
                  Edit User
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default observer(ViewUser);
