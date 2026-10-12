import { useEffect, useState, useLayoutEffect } from "react";
import "./AdminUserDrawer.css";
import {
  FiX,
  FiCopy,
  FiCheck,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiShield,
  FiMonitor,
  FiActivity,
  FiUserCheck,
  FiEdit2,
  FiBriefcase,
  FiAlertTriangle,
  FiUser,
  FiGlobe,
  FiCpu,
  FiKey,
  FiLock,
  FiGift,
  FiFileText,
  FiClock,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  getInitials,
  getInitialsColorClass,
  formatDob,
  formatLastActive,
  formatFullDateTime,
  isPlaceholderPhoto,
} from "../utils/adminPanelUtils";

function calculateAge(dob) {
  if (!dob) return null;
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} yrs` : null;
  } catch {
    return null;
  }
}

function formatJoinedDate(createdAt, _id) {
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  if (_id && typeof _id === "string" && _id.length >= 8) {
    try {
      const timestamp = parseInt(_id.substring(0, 8), 16) * 1000;
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
    }
  }
  return "N/A";
}

function formatExpDate(dateVal) {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function AdminUserDrawer({
  user: initialUser,
  onClose,
  userStore,
  navigate,
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [fullUser, setFullUser] = useState(initialUser);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const currentUser = userStore?.currentUser;
  const isSelf = currentUser?._id === initialUser?._id;

  useEffect(() => {
    if (!initialUser?._id) return;
    let isMounted = true;
    setFullUser(initialUser);

    const loadFreshData = async () => {
      setLoadingDetails(true);
      try {
        if (userStore?.fetchUserById) {
          const fresh = await userStore.fetchUserById(initialUser._id);
          if (isMounted && fresh) {
            setFullUser((prev) => ({ ...prev, ...fresh }));
          }
        }
      } catch {
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    };

    loadFreshData();
    return () => {
      isMounted = false;
    };
  }, [initialUser?._id, userStore]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useLayoutEffect(() => {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  if (!initialUser) return null;

  const u = fullUser || initialUser;

  const handleCopy = (text, key, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.info(`Copied ${label} to clipboard`, { autoClose: 1400 });
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const activeData = formatLastActive(u.lastLogin, u.isOnline);
  const avatarPhoto = u.profilephoto || u.profileImage;
  const hasCustomPhoto = avatarPhoto && !isPlaceholderPhoto(avatarPhoto);
  const avatarUrl = hasCustomPhoto
    ? avatarPhoto.startsWith("http")
      ? avatarPhoto
      : `${import.meta.env.VITE_API_URL}/uploads/${avatarPhoto}`
    : null;

  const ageText = calculateAge(u.dob);
  const formattedDobStr = formatDob(u.dob);
  const joinedDateStr = formatJoinedDate(u.createdAt, u._id);
  const experiences = u.experience || [];

  return (
    <div
      className="cup-backdrop"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="View Details"
    >
      <div
        className="cup-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cup-mobile-handle-bar">
          <div className="cup-drag-pill" />
        </div>

        <div className="cup-header">
          <div className="cup-header-left">
            <button
              type="button"
              className="cup-traffic-close"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close"
            >
              <FiX size={14} />
            </button>
            <div className="cup-header-title-wrap">
              <span className="cup-header-title">View Details</span>
              {loadingDetails && (
                <span className="cup-syncing-pill">Syncing...</span>
              )}
            </div>
          </div>

          <div className="cup-header-right">
            <button
              type="button"
              className="cup-copy-id-chip"
              onClick={() => handleCopy(u._id, "id", "User ID")}
              title="Copy User ID"
            >
              <span className="font-mono">ID: {u._id?.substring(0, 8)}...</span>
              {copiedKey === "id" ? <FiCheck size={11} /> : <FiCopy size={11} />}
            </button>
          </div>
        </div>

        <div className="cup-segment-wrap">
          <div className="cup-segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "profile"}
              className={`cup-seg-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "experience"}
              className={`cup-seg-btn ${activeTab === "experience" ? "active" : ""}`}
              onClick={() => setActiveTab("experience")}
            >
              Experience {experiences.length > 0 && `(${experiences.length})`}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "telemetry"}
              className={`cup-seg-btn ${activeTab === "telemetry" ? "active" : ""}`}
              onClick={() => setActiveTab("telemetry")}
            >
              Telemetry
            </button>
          </div>
        </div>

        <div className="cup-body">
          {activeTab === "profile" && (
            <div className="cup-view-content">
              <div className="cup-hero-card">
                <div className="cup-hero-banner-strip" />

                <div className="cup-hero-card-inner">
                  <div className="cup-avatar-wrapper">
                    {hasCustomPhoto ? (
                      <img
                        src={avatarUrl}
                        alt={u.name}
                        className="cup-avatar-img"
                      />
                    ) : (
                      <div
                        className={`cup-avatar-initials ${getInitialsColorClass(u.name)}`}
                      >
                        {getInitials(u.name)}
                      </div>
                    )}
                    {u.isOnline && (
                      <span
                        className="cup-online-beacon"
                        title="User is currently active online"
                      />
                    )}
                  </div>

                  <div className="cup-hero-info">
                    <div className="cup-hero-name-row">
                      <h2 className="cup-hero-name">{u.name || "User"}</h2>
                      {isSelf && <span className="cup-tag-you">You</span>}
                    </div>
                    <p className="cup-hero-email">{u.email}</p>

                    <div className="cup-hero-tag-row">
                      <span
                        className={`cup-pill-tag ${u.role === "admin" ? "admin" : "user"}`}
                      >
                        <FiShield size={10} />
                        <span>{u.role === "admin" ? "Administrator" : "User"}</span>
                      </span>

                      <span
                        className={`cup-pill-tag ${u.status === "suspended" ? "suspended" : u.status === "banned" ? "banned" : "active"}`}
                      >
                        <span className="cup-dot-indicator" />
                        <span>
                          {(u.status || "active").toUpperCase()}
                        </span>
                      </span>

                      {u.inviteStatus === "pending" ? (
                        <span
                          className={`cup-pill-tag ${
                            u.inviteDeliveryStatus === "failed"
                              ? "unverified"
                              : u.inviteTokenExpire && new Date(u.inviteTokenExpire) < new Date()
                              ? "unverified"
                              : "pending-email"
                          }`}
                          title={`Invited by ${u.invitedBy?.name || "Admin"}`}
                        >
                          <FiClock size={10} />
                          <span>
                            {u.inviteDeliveryStatus === "failed"
                              ? "Delivery Failed"
                              : u.inviteTokenExpire && new Date(u.inviteTokenExpire) < new Date()
                              ? "Invite Expired"
                              : "Invite Pending"}
                          </span>
                        </span>
                      ) : u.isVerified ? (
                        <span className="cup-pill-tag verified" title="Email Verified">
                          <FiUserCheck size={10} />
                          <span>Verified Account</span>
                        </span>
                      ) : (
                        <span className="cup-pill-tag unverified" title="Email Not Verified">
                          <FiAlertTriangle size={10} />
                          <span>Unverified</span>
                        </span>
                      )}

                      {u.pendingEmail && (
                        <span
                          className="cup-pill-tag pending-email"
                          title={`Pending change to ${u.pendingEmail}`}
                        >
                          <FiMail size={10} />
                          <span>Pending Email Change</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cup-inset-section">
                <span className="cup-inset-header">ACCOUNT INFORMATION</span>
                <div className="cup-inset-card">
                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-blue">
                        <FiKey size={13} />
                      </div>
                      <span>User ID</span>
                    </div>
                    <span className="cup-row-val mono">
                      {u._id}
                      <button
                        type="button"
                        className="cup-copy-icon-btn"
                        onClick={() => handleCopy(u._id, "row_id", "User ID")}
                        title="Copy ID"
                      >
                        {copiedKey === "row_id" ? <FiCheck size={11} /> : <FiCopy size={11} />}
                      </button>
                    </span>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-coral">
                        <FiMail size={13} />
                      </div>
                      <span>Email Address</span>
                    </div>
                    <span className="cup-row-val">
                      <span className="cup-clickable-val" onClick={() => handleCopy(u.email, "row_email", "Email")}>
                        {u.email}
                      </span>
                      <button
                        type="button"
                        className="cup-copy-icon-btn"
                        onClick={() => handleCopy(u.email, "row_email", "Email")}
                        title="Copy Email"
                      >
                        {copiedKey === "row_email" ? <FiCheck size={11} /> : <FiCopy size={11} />}
                      </button>
                    </span>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-green">
                        <FiPhone size={13} />
                      </div>
                      <span>Phone Number</span>
                    </div>
                    <span className="cup-row-val">
                      {u.phone ? (
                        <>
                          <span className="cup-accent-phone">{u.phone}</span>
                          <button
                            type="button"
                            className="cup-copy-icon-btn"
                            onClick={() => handleCopy(u.phone, "row_phone", "Phone")}
                            title="Copy Phone"
                          >
                            {copiedKey === "row_phone" ? <FiCheck size={11} /> : <FiCopy size={11} />}
                          </button>
                        </>
                      ) : (
                        <span className="cup-text-muted">Not Added</span>
                      )}
                    </span>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-purple">
                        <FiCalendar size={13} />
                      </div>
                      <span>Joined Date</span>
                    </div>
                    <span className="cup-row-val">
                      {joinedDateStr}
                    </span>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-teal">
                        <FiShield size={13} />
                      </div>
                      <span>Email Status</span>
                    </div>
                    <span className={`cup-row-val ${u.isVerified ? "cup-val-green" : "cup-val-amber"}`}>
                      {u.isVerified
                        ? "✓ Verified"
                        : u.inviteStatus === "pending"
                        ? "⏳ Invitation Pending"
                        : "⚠ Verification Pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cup-inset-section">
                <span className="cup-inset-header">PERSONAL & LOCATION</span>
                <div className="cup-inset-card">
                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-orange">
                        <FiGift size={13} />
                      </div>
                      <span>Date of Birth</span>
                    </div>
                    <span className="cup-row-val">
                      {formattedDobStr !== "—" ? (
                        <span>
                          {formattedDobStr} {ageText && <span className="cup-age-pill">({ageText})</span>}
                        </span>
                      ) : (
                        <span className="cup-text-muted">Not Added</span>
                      )}
                    </span>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-pink">
                        <FiUser size={13} />
                      </div>
                      <span>Gender</span>
                    </div>
                    <span className="cup-row-val">
                      {u.gender ? (
                        <span className="cup-capitalize">{u.gender}</span>
                      ) : (
                        <span className="cup-text-muted">Not Added</span>
                      )}
                    </span>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-violet">
                        <FiMapPin size={13} />
                      </div>
                      <span>City</span>
                    </div>
                    <span className="cup-row-val">
                      {u.city || <span className="cup-text-muted">Not Added</span>}
                    </span>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-cyan">
                        <FiGlobe size={13} />
                      </div>
                      <span>State & Country</span>
                    </div>
                    <span className="cup-row-val">
                      {[u.state, u.country].filter(Boolean).join(", ") || (
                        <span className="cup-text-muted">Not Added</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cup-inset-section">
                <span className="cup-inset-header">ABOUT ME / BIOGRAPHY</span>
                <div className="cup-inset-card">
                  <div className="cup-bio-content">
                    <div className="cup-bio-header-row">
                      <div className="cup-icon-squircle squircle-amber">
                        <FiFileText size={13} />
                      </div>
                      <span className="cup-bio-label">Professional Summary</span>
                    </div>
                    {u.bio ? (
                      <p className="cup-bio-paragraph">{u.bio}</p>
                    ) : (
                      <p className="cup-empty-bio">This user hasn't added a bio yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "experience" && (
            <div className="cup-view-content">
              <div className="cup-inset-section">
                <div className="cup-section-title-row">
                  <span className="cup-inset-header">PROFESSIONAL EXPERIENCE</span>
                  <span className="cup-count-badge">
                    {experiences.length} {experiences.length === 1 ? "Position" : "Positions"}
                  </span>
                </div>

                {experiences.length > 0 ? (
                  <div className="cup-inset-card cup-exp-list">
                    {experiences.map((exp, idx) => {
                      const companyInitial = exp.company
                        ? exp.company.charAt(0).toUpperCase()
                        : "C";
                      const cleanDesc = exp.description
                        ? exp.description.replace(/^\/\/\s*/, "").trim()
                        : "";
                      const bulletList = cleanDesc
                        ? cleanDesc
                            .split("\n")
                            .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
                            .filter(Boolean)
                        : [];

                      return (
                        <div key={exp._id || idx} className="cup-exp-card">
                          <div className="cup-exp-card-header">
                            <div className={`cup-exp-company-logo ${idx % 2 === 0 ? "logo-primary" : "logo-accent"}`}>
                              <span>{companyInitial}</span>
                            </div>

                            <div className="cup-exp-title-block">
                              <div className="cup-exp-row-head">
                                <h4 className="cup-exp-job-title">{exp.title}</h4>
                                <span className="cup-exp-date-pill">
                                  {formatExpDate(exp.startDate).toUpperCase()} —{" "}
                                  {exp.isCurrent
                                    ? "PRESENT"
                                    : formatExpDate(exp.endDate).toUpperCase()}
                                </span>
                              </div>

                              <div className="cup-exp-company-line">
                                <span className="cup-exp-company-name">
                                  {exp.company}
                                </span>
                                {exp.location && (
                                  <span className="cup-exp-location">
                                    • {exp.location}
                                  </span>
                                )}
                                {exp.employmentType && (
                                  <span className="cup-exp-type">
                                    • {exp.employmentType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {bulletList.length > 0 && (
                            <div className="cup-exp-bullets">
                              <ul className="cup-bullet-list">
                                {bulletList.map((bullet, bIdx) => (
                                  <li key={bIdx} className="cup-bullet-item">
                                    <span className="cup-bullet-dot">•</span>
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="cup-inset-card cup-empty-card">
                    <div className="cup-empty-icon-wrap">
                      <FiBriefcase size={28} />
                    </div>
                    <h4 className="cup-empty-title">No Experience Added</h4>
                    <p className="cup-empty-sub">
                      This user has not listed any professional work history or roles yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "telemetry" && (
            <div className="cup-view-content">
              <div className="cup-inset-section">
                <span className="cup-inset-header">SESSION & HARDWARE TELEMETRY</span>
                <div className="cup-inset-card">
                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-green">
                        <FiActivity size={13} />
                      </div>
                      <span>Last Active</span>
                    </div>
                    <div className="cup-telemetry-val-group">
                      <span
                        className={`cup-last-active-tag ${activeData.isOnline ? "online" : activeData.isNever ? "never" : "recent"}`}
                      >
                        {activeData.isOnline && <span className="cup-live-pulse-dot" />}
                        {activeData.text}
                      </span>
                      <span className="cup-exact-datetime">
                        ({formatFullDateTime(u.lastLogin)})
                      </span>
                    </div>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-blue">
                        <FiMonitor size={13} />
                      </div>
                      <span>Active Sessions</span>
                    </div>
                    <span className="cup-row-val">
                      <span className="cup-session-count-chip">
                        {u.activeSessionCount || (u.isOnline ? 1 : 0)} Active
                      </span>
                    </span>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-orange">
                        <FiCpu size={13} />
                      </div>
                      <span>Last Known IP</span>
                    </div>
                    <span className="cup-row-val mono">
                      {u.lastDeviceInfo?.ip || "127.0.0.1"}
                      <button
                        type="button"
                        className="cup-copy-icon-btn"
                        onClick={() =>
                          handleCopy(
                            u.lastDeviceInfo?.ip || "127.0.0.1",
                            "ip",
                            "IP Address"
                          )
                        }
                        title="Copy IP"
                      >
                        {copiedKey === "ip" ? <FiCheck size={11} /> : <FiCopy size={11} />}
                      </button>
                    </span>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-violet">
                        <FiGlobe size={13} />
                      </div>
                      <span>Browser & OS</span>
                    </div>
                    <span className="cup-row-val">
                      {u.lastDeviceInfo?.userAgent
                        ? u.lastDeviceInfo.userAgent.substring(0, 48)
                        : "Modern Desktop Web"}
                    </span>
                  </div>

                  <div className="cup-inset-row">
                    <div className="cup-row-label">
                      <div className="cup-icon-squircle squircle-purple">
                        <FiLock size={13} />
                      </div>
                      <span>Security Status</span>
                    </div>
                    <span className="cup-row-val cup-val-blue font-medium">
                      {u.isVerified ? "2FA & Email Enforced" : "Standard Security"}
                    </span>
                  </div>
                </div>
              </div>

              {u.statusReason && (
                <div className="cup-inset-section">
                  <span className="cup-inset-header">MODERATION AUDIT NOTE</span>
                  <div className="cup-inset-card cup-alert-inset">
                    <div className="cup-alert-head">
                      <FiAlertTriangle size={14} />
                      <span>Account Restriction Reason</span>
                    </div>
                    <p className="cup-alert-reason">"{u.statusReason}"</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="cup-footer">
          <button
            type="button"
            className="cup-edit-full-btn"
            onClick={() => {
              onClose();
              navigate(`/admin/users/${u._id}/edit`);
            }}
            title="Edit user profile"
          >
            <FiEdit2 size={13} />
            <span>Edit User</span>
          </button>
        </div>
      </div>
    </div>
  );
}
