/* eslint-disable react-refresh/only-export-components */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import AppLayout from "../AppLayout/AppLayout";
import { toast } from "react-toastify";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import { calculateProfileCompletion } from "../../utils/profileCompletion";

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

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef(null);
  const [showCompletion, setShowCompletion] = useState(true);

  const { userStore } = useStore();
  const user = userStore.currentUser;
  const profileLoading = userStore.loading.fetchProfile;
  const photoLoading = userStore.loading.photoUpdate;
  const loading = profileLoading || !user;
  const joinedDate = getJoinedDate(user);
  const handleHideCompletion = () => {
    setShowCompletion(false);
  };
  useEffect(() => {
    userStore.fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const percentage = loading ? 0 : calculateProfileCompletion(user);
  const profileInfo = [
    {
      label: "Full Name",
      value: user.name,
    },
    {
      label: "Email",
      value: user.email,
    },
    {
      label: "Gender",
      value: user.gender,
    },
    {
      label: "Date of Birth",
      value: user.dob
        ? new Date(user.dob).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Not Added",
    },
    {
      label: "Account Type",
      value: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    },
    {
      label: "Phone",
      value: user.phone || "Not Added",
    },
    {
      label: "Country",
      value: user.country || "Not Added",
    },
    {
      label: "State",
      value: user.state || "Not Added",
    },
    {
      label: "City",
      value: user.city || "Not Added",
    },
    {
      label: "Last Login",
      value: user.lastLogin
        ? new Date(user.lastLogin).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "First Login",
    },
  ];

  const handlephotochange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handlephotoupload = async () => {
    if (loading) return;
    if (!photo) return;

    const formData = new FormData();
    formData.append("profilephoto", photo);
    try {
      const data = await userStore.photoUpdate(formData);

      setPhoto(null);
      setPreview("");
      await userStore.fetchProfile();
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.message || "Try again");
    }
  };

  const handleEditProfile = () => {
    if (loading) return;
    navigate("/profile/EditProfile");
  };
  const avatarSrc =
    preview || `${import.meta.env.VITE_API_URL}/uploads/${user?.profilephoto}`;

  return (
    <AppLayout title="My Profile" subtitle="Manage your account settings">
      <div className="page-container-centered">
        <div className="profile-layout card">
          <div className="profile-banner">
            <div className="banner-blue-glow"></div>
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
                      alt={user.name}
                      onClick={() => setShowImageModal(true)}
                    />

                    <button
                      type="button"
                      className="avatar-edit-btn"
                      onClick={() => fileInputRef.current.click()}
                      aria-label="Change profile photo"
                      title="Change photo"
                    >
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
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handlephotochange}
                    />

                    {preview && (
                      <button
                        type="button"
                        className="avatar-save-btn btn btn-primary btn-sm"
                        onClick={handlephotoupload}
                        disabled={photoLoading}
                      >
                        {photoLoading ? "Saving..." : "Save Photo"}
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="profile-identity">
                {loading ? (
                  <div className="skeleton skeleton-profile-joined"></div>
                ) : (
                  joinedDate && (
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
                  )
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
                        <h3 className="completion-title">Profile Completion</h3>
                        <p className="completion-subtitle">
                          Keep your profile up to date.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="completion-close-btn"
                        onClick={handleHideCompletion}
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

            <div className="profile-section">
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
                      .map((item) => (
                        <div className="meta-item" key={item.label}>
                          <span className="meta-label">{item.label}</span>
                          <span className="meta-value">{item.value}</span>
                        </div>
                      ))}
              </div>
            </div>
            <div className="profile-section">
              <h3 className="profile-section-title">About Me</h3>

              <div className="bio-card">
                {loading ? (
                  <>
                    <div className="skeleton skeleton-bio-line"></div>
                    <div className="skeleton skeleton-bio-line"></div>
                    <div className="skeleton skeleton-bio-line skeleton-bio-short"></div>
                  </>
                ) : user.bio ? (
                  <p className="bio-content">{user.bio}</p>
                ) : (
                  <p className="bio-empty">No bio added yet.</p>
                )}
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
            alt={user.name}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </AppLayout>
  );
}

export default observer(Profile);
