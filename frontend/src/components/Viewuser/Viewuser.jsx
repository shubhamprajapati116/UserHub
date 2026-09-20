import "./ViewUser.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import AppLayout from "../../components/AppLayout/AppLayout";
import "../Experience/experience.css";

import { toast } from "react-toastify";
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
  FaFingerprint,
} from "react-icons/fa";
import { FiCopy, FiCheck } from "react-icons/fi";

function getJoinedDate(user) {
  if (!user) return null;
  if (user.createdAt) {
    const d = new Date(user.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (user._id && typeof user._id === "string" && user._id.length >= 8) {
    try {
      const timestamp = parseInt(user._id.substring(0, 8), 16) * 1000;
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) return d;
    } catch {
      // ignore
    }
  }
  return null;
}

function getLastLogin(user) {
  if (!user) return null;
  const loginVal =
    user.lastLogin || user.lastDeviceInfo?.lastLoginAt || user.lastLoginAt;
  if (!loginVal) return null;
  const d = new Date(loginVal);
  return isNaN(d.getTime()) ? null : d;
}

function ViewUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userStore } = useStore();

  const [isExpOpen, setIsExpOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.info(`Copied ${label} to clipboard!`, { autoClose: 1500 });
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  useEffect(() => {
    userStore.fetchUserById(id);
  }, [id, userStore]);

  const user = userStore.editUser || {};
  const loading = userStore.loading.fetchUserById || false;

  const joinedDate = getJoinedDate(user);
  const lastLoginDate = getLastLogin(user);

  const safeFormatDate = (dateVal, options = {}) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString(
        "en-IN",
        Object.keys(options).length
          ? options
          : {
              day: "numeric",
              month: "long",
              year: "numeric",
            },
      );
    } catch {
      return "N/A";
    }
  };

  const safeFormatDateTime = (dateVal) => {
    if (!dateVal) return null;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return null;
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
      title={loading ? "User Details" : user.name || "User Details"}
      subtitle="Comprehensive user profile, account details, and activity"
      breadcrumbs={[
        { label: "User Management", path: "/admin/users" },
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
                    user?.profilephoto
                      ? `${import.meta.env.VITE_API_URL}/uploads/${user.profilephoto}`
                      : "https://ui-avatars.com/api/?name=User"
                  }
                  alt={user?.name || "User"}
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
                user?.name || "User"
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

                  {joinedDate && (
                    <span className="badge joined-badge">
                      <FaCalendarAlt />
                      Joined{" "}
                      {safeFormatDate(joinedDate, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="userview-info-section">
            {/* Left */}
            <div className="userview-card">
              <h3>Account Information</h3>

              <div className="userview-grid">
                {/* User ID */}
                <div className="userview-item">
                  <FaFingerprint />
                  <div>
                    <span>User ID</span>
                    <strong className="font-mono" title={user._id}>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user._id || "N/A"
                      )}
                    </strong>
                  </div>
                  {!loading && user._id && (
                    <button
                      type="button"
                      className={`userview-copy-icon-btn ${copiedKey === "id" ? "copied" : ""}`}
                      onClick={() => handleCopy(user._id, "id", "User ID")}
                      title={copiedKey === "id" ? "Copied!" : "Copy User ID"}
                      aria-label="Copy User ID"
                    >
                      {copiedKey === "id" ? <FiCheck /> : <FiCopy />}
                    </button>
                  )}
                </div>

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
                    <span>Email Address</span>
                    <strong className="font-mono" title={user.email}>
                      {loading ? (
                        <div className="skeleton skeleton-value skeleton-email"></div>
                      ) : (
                        user.email || "N/A"
                      )}
                    </strong>
                    {user.pendingEmail && (
                      <div className="userview-pending-email-badge">
                        <span>⏳ Pending Change: <strong>{user.pendingEmail}</strong></span>
                      </div>
                    )}
                  </div>
                  {!loading && user.email && (
                    <button
                      type="button"
                      className={`userview-copy-icon-btn ${copiedKey === "email" ? "copied" : ""}`}
                      onClick={() => handleCopy(user.email, "email", "Email")}
                      title={copiedKey === "email" ? "Copied!" : "Copy Email Address"}
                      aria-label="Copy Email Address"
                    >
                      {copiedKey === "email" ? <FiCheck /> : <FiCopy />}
                    </button>
                  )}
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

                {/* Account Status */}
                <div className="userview-item">
                  <FaCheckCircle />
                  <div>
                    <span>Account Status</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-small"></div>
                      ) : (
                        user.status
                          ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
                          : "Active"
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
                {/* Email Verification */}
                <div className="userview-item">
                  <FaCheckCircle />
                  <div>
                    <span>Email Verification</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-small"></div>
                      ) : user.isVerified ? (
                        <span className="verified">Verified</span>
                      ) : (
                        <span className="unverified">Unverified</span>
                      )}
                    </strong>
                  </div>
                </div>

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
            <h3>Biography</h3>

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
                <p className="empty-bio">No biography provided yet.</p>
              )}
            </div>
          </div>

          <div className="userview-card userview-exp-card">
            <div
              className="experience-toggle-header"
              onClick={() => setIsExpOpen(!isExpOpen)}
            >
              <div className="exp-toggle-title-wrap">
                <div className="exp-toggle-icon">
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
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <h3 className="exp-toggle-heading">Work Experience</h3>
                <span className="exp-count-pill">
                  {user?.experience ? user.experience.length : 0}{" "}
                  {user?.experience?.length === 1 ? "Role" : "Roles"}
                </span>
              </div>

              <button
                type="button"
                className="exp-collapse-btn"
                aria-label={isExpOpen ? "Collapse Experience" : "Expand Experience"}
              >
                <span>{isExpOpen ? "Hide" : "View"}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isExpOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            {isExpOpen && (
              <div className="timeline-container exp-view-timeline">
                {loading ? (
                  Array.from({ length: 1 }).map((_, idx) => (
                    <div
                      className="experience-card apple-card-style skeleton-exp-card"
                      key={idx}
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
                        {/* Top Header Row - Clean Balanced Layout */}
                        <div className="apple-card-header">
                          <div className="apple-card-header-top">
                            <div className="apple-header-left">
                              <div className="apple-company-logo">
                                <span>{companyInitial}</span>
                              </div>

                              <div className="apple-title-group">
                                <div className="apple-title-row">
                                  <h4 className="apple-job-title">{exp.title}</h4>
                                  <span className="apple-company-sep">@</span>
                                  <span className="apple-company-name">{exp.company}</span>
                                  {exp.location && (
                                    <span className="apple-company-loc">({exp.location})</span>
                                  )}
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
                      ) : joinedDate ? (
                        safeFormatDate(joinedDate, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      ) : (
                        "N/A"
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
                      ) : lastLoginDate && safeFormatDateTime(lastLoginDate) ? (
                        safeFormatDateTime(lastLoginDate)
                      ) : (
                        <span className="last-login-pending">
                          First Login Pending
                        </span>
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
                <button
                  type="button"
                  className="userview-back-btn"
                  onClick={() => navigate("/admin/users")}
                >
                  Back
                </button>

                <button
                  type="button"
                  className="userview-edit-btn"
                  onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                >
                  <FaEdit />
                  Edit User
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default observer(ViewUser);
