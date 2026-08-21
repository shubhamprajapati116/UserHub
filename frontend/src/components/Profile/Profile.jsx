/* eslint-disable react-refresh/only-export-components */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import "../Experience/experience.css";
import AppLayout from "../AppLayout/AppLayout";
import { toast } from "react-toastify";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import { calculateProfileCompletion } from "../../utils/profileCompletion";
import ImageCropperModal from "../ImageCropper/ImageCropperModal";
import ExperienceModal from "../Experience/ExperienceModal";
import DeleteConfirmModal from "../Experience/DeleteConfirmModal";

function getJoinedDate(user) {
  if (!user) return null;
  if (user.createdAt) {
    return new Date(user.createdAt);
  }
  if (user._id) {
    return new Date(parseInt(user._id.substring(0, 8), 16) * 1000);
  }
  return null;
}
function Profile() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [deletingExp, setDeletingExp] = useState(null);
  const [showAllExp, setShowAllExp] = useState(false);
  const fileInputRef = useRef(null);
  const [showCompletion, setShowCompletion] = useState(() => {
    return localStorage.getItem("hide_profile_completion") !== "true";
  });

  const { userStore } = useStore();
  const user = userStore.currentUser;
  const photoLoading = userStore.loading.photoUpdate;
  const expLoading = userStore.loading.experience;
  const loading = userStore.loading.fetchProfile || !user;
  const joinedDate = getJoinedDate(user);
  const handleHideCompletion = () => {
    setShowCompletion(false);
    localStorage.setItem("hide_profile_completion", "true");
  };
  const handleShowCompletion = () => {
    setShowCompletion(true);
    localStorage.removeItem("hide_profile_completion");
  };
  useEffect(() => {
    if (showImageModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showImageModal]);

  useEffect(() => {
    userStore.fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleAddExpClick = () => {
    setEditingExp(null);
    setShowExpModal(true);
  };
  const handleEditExpClick = (exp) => {
    setEditingExp(exp);
    setShowExpModal(true);
  };
  const handleSaveExp = async (expData) => {
    try {
      let res;
      if (editingExp) {
        res = await userStore.updateExperience(editingExp._id, expData);
      } else {
        res = await userStore.addExperience(expData);
      }
      setShowExpModal(false);
      setEditingExp(null);
      toast.success(res?.message || "Experience saved successfully!");
    } catch (error) {
      toast.error(error?.message || "Failed to save experience");
    }
  };

  const handleDeleteExpClick = (exp) => {
    setDeletingExp(exp);
  };

  const handleConfirmDelete = async () => {
    if (!deletingExp) return;
    try {
      const res = await userStore.deleteExperience(deletingExp._id);
      setDeletingExp(null);
      toast.success(res?.message || "Experience deleted successfully");
    } catch (error) {
      toast.error(error?.message || "Failed to delete experience");
    }
  };

  const formatDateStr = (dateVal) => {
    if (!dateVal) return "";
    return new Date(dateVal).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  };

  const percentage = loading ? 0 : calculateProfileCompletion(user);
  const profileInfo =
    loading || !user
      ? []
      : [
          {
            label: "Full Name",
            value: user?.name,
            colorClass: "icon-indigo",
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
          {
            label: "Email",
            value: user?.email,
            colorClass: "icon-cyan",
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            ),
          },
          {
            label: "Gender",
            value: user?.gender,
            colorClass: "icon-pink",
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v3M12 20v3M1 12h3M20 12h3" />
              </svg>
            ),
          },
          {
            label: "Date of Birth",
            value: user?.dob
              ? new Date(user.dob).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Not Added",
            colorClass: "icon-amber",
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
          },
          {
            label: "Account Type",
            value: user?.role
              ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
              : "User",
            colorClass: "icon-purple",
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            ),
          },
          {
            label: "Phone",
            value: user?.phone || "Not Added",
            colorClass: "icon-emerald",
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            ),
          },
          {
            label: "Country",
            value: user?.country || "Not Added",
            colorClass: "icon-blue",
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            ),
          },
          {
            label: "State",
            value: user?.state || "Not Added",
            colorClass: "icon-teal",
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            ),
          },
          {
            label: "City",
            value: user?.city || "Not Added",
            colorClass: "icon-violet",
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18" />
                <path d="M19 21v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4" />
                <path d="M9 10h6" />
                <path d="M9 6h6" />
                <path d="M12 2v4" />
              </svg>
            ),
          },
          {
            label: "Last Login",
            value: user?.lastLogin
              ? new Date(user.lastLogin).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "First Login",
            colorClass: "icon-lime",
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
          },
        ];

  const handlephotochange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImageSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropSave = async (croppedFile) => {
    const objectUrl = URL.createObjectURL(croppedFile);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append("profilephoto", croppedFile);

    try {
      const data = await userStore.photoUpdate(formData);
      setPreview("");
      setShowCropper(false);
      await userStore.fetchProfile();
      toast.success(data.message || "Profile photo updated successfully!");
    } catch (error) {
      setPreview("");
      setShowCropper(false);
      if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to update profile photo");
      }
    }
  };

  const handleEditProfile = () => {
    if (loading) return;
    navigate("/profile/edit");
  };
  const avatarSrc =
    preview || `${import.meta.env.VITE_API_URL}/uploads/${user?.profilephoto}`;

  return (
    <AppLayout title="My Profile" subtitle="Manage your account settings">
      <div className="page-container-centered">
        <div className="profile-layout card">
          <div className="profile-banner">
            <div className="banner-aurora-glow"></div>
            <svg
              className="banner-aurora-wave"
              viewBox="0 0 1200 240"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="auroraGrad1"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
                  <stop offset="45%" stopColor="#a855f7" stopOpacity="0.95" />
                  <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient
                  id="auroraGrad2"
                  x1="100%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#818cf8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.35" />
                </linearGradient>
                <filter
                  id="auroraGlow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Ambient Glow Ribbon */}
              <path
                d="M-40,150 Q 260,40, 560,135 T 1160,65 Q 1240,95, 1260,110"
                fill="none"
                stroke="url(#auroraGrad2)"
                strokeWidth="32"
                filter="url(#auroraGlow)"
              />
              {/* Primary Neon Aurora Wave Ribbon */}
              <path
                d="M-40,140 Q 240,55, 540,140 T 1140,55 Q 1220,85, 1260,100"
                fill="none"
                stroke="url(#auroraGrad1)"
                strokeWidth="14"
                filter="url(#auroraGlow)"
              />
              {/* Crisp Center Light Core */}
              <path
                d="M-40,140 Q 240,55, 540,140 T 1140,55 Q 1220,85, 1260,100"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
            </svg>
            <div className="banner-overlay-fade"></div>
          </div>

          <div className="profile-body">
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
                      onClick={() => setShowImageModal(true)}
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
                      onChange={handlephotochange}
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
                        onClick={handleShowCompletion}
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
                    onClick={handleEditProfile}
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
            {/* ── Dashboard Grid Layout ── */}
            <div className="profile-main-grid">
              {/* Left Column: Profile Completion, About Me, Work Experience */}
              <div className="profile-left-col">
                {showCompletion && (
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
                            <h3 className="completion-title">
                              Profile Completion
                            </h3>
                            <p className="completion-subtitle">
                              Keep your profile up to date.
                            </p>
                          </div>

                          <button
                            type="button"
                            className="completion-close-btn"
                            onClick={handleHideCompletion}
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
                )}

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
                      <p className="bio-empty">No bio added yet.</p>
                    )}
                  </div>
                </div>

                <div className="profile-section profile-exp-section">
                  <div className="experience-section-header">
                    <h3 className="profile-section-title" style={{ margin: 0 }}>
                      Work Experience
                    </h3>
                    <button
                      type="button"
                      className="add-exp-btn"
                      onClick={handleAddExpClick}
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
                                    </div>
                                  </div>

                                  <div className="experience-actions">
                                    <button
                                      type="button"
                                      className="exp-action-btn edit"
                                      onClick={() => handleEditExpClick(exp)}
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
                                      onClick={() => handleDeleteExpClick(exp)}
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
                          <div
                            style={{ textAlign: "center", marginTop: "4px" }}
                          >
                            <button
                              type="button"
                              className="add-exp-btn"
                              onClick={() => setShowAllExp(!showAllExp)}
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
                          onClick={handleAddExpClick}
                        >
                          + Add Experience
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Personal Information Grid */}
              <div className="profile-right-col">
                <div className="profile-section profile-info-section">
                  <h3 className="profile-section-title">
                    Personal Information
                  </h3>

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
                          .map((item) => (
                            <div className="meta-item" key={item.label}>
                              <div className="meta-item-header">
                                <div
                                  className={`meta-icon ${item.colorClass || ""}`}
                                >
                                  {item.icon}
                                </div>
                                <span className="meta-label">{item.label}</span>
                              </div>
                              <span className="meta-value">{item.value}</span>
                            </div>
                          ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {!loading && showImageModal && (
        <div className="image-modal" onClick={() => setShowImageModal(false)}>
          <img
            className="image-modal-photo"
            src={avatarSrc}
            alt={user?.name || "Profile"}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {showCropper && (
        <ImageCropperModal
          imageSrc={cropperImageSrc}
          onCropComplete={handleCropSave}
          onClose={() => setShowCropper(false)}
          loading={photoLoading}
        />
      )}
      {showExpModal && (
        <ExperienceModal
          editData={editingExp}
          onSave={handleSaveExp}
          onClose={() => setShowExpModal(false)}
          loading={expLoading}
        />
      )}
      {deletingExp && (
        <DeleteConfirmModal
          title={deletingExp.title}
          subtitle={deletingExp.company}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingExp(null)}
          loading={expLoading}
        />
      )}
    </AppLayout>
  );
}

export default observer(Profile);
