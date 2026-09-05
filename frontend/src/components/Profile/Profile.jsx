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

// Modular Subcomponents
import ProfileBanner from "./components/ProfileBanner";
import ProfileHeader from "./components/ProfileHeader";
import ProfileCompletion from "./components/ProfileCompletion";
import ProfileBio from "./components/ProfileBio";
import ProfileExperience from "./components/ProfileExperience";
import ProfileInfoGrid from "./components/ProfileInfoGrid";

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

  // FIX: Only show skeletons on initial load if user data is not yet in store/cache
  const loading = !user;
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

  const handleAddField = (fieldKey) => {
    navigate("/profile/edit", { state: { focusField: fieldKey } });
  };

  const percentage = user ? calculateProfileCompletion(user) : 0;

  const profileInfo = !user
    ? []
    : [
        {
          label: "Full Name",
          value: user?.name,
          fieldKey: "name",
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
          fieldKey: "email",
          isVerified: user?.isVerified,
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
          fieldKey: "gender",
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
          fieldKey: "dob",
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
          fieldKey: "phone",
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
          fieldKey: "state",
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
          fieldKey: "city",
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
          {/* Top Aurora Banner */}
          <ProfileBanner />

          <div className="profile-body">
            {/* Header / Avatar / Identity / Actions */}
            <ProfileHeader
              user={user}
              loading={loading}
              photoLoading={photoLoading}
              avatarSrc={avatarSrc}
              joinedDate={joinedDate}
              percentage={percentage}
              showCompletion={showCompletion}
              onShowCompletion={handleShowCompletion}
              onOpenImageModal={() => setShowImageModal(true)}
              onPhotoChange={handlephotochange}
              onEditProfile={handleEditProfile}
              fileInputRef={fileInputRef}
            />

            {/* Dashboard Grid Layout */}
            <div className="profile-main-grid">
              {/* Left Column: Profile Completion, About Me, Work Experience */}
              <div className="profile-left-col">
                {showCompletion && (
                  <ProfileCompletion
                    loading={loading}
                    percentage={percentage}
                    onHideCompletion={handleHideCompletion}
                  />
                )}

                <ProfileBio
                  user={user}
                  loading={loading}
                  onAddBio={() => handleAddField("bio")}
                />

                <ProfileExperience
                  user={user}
                  loading={loading}
                  showAllExp={showAllExp}
                  onToggleShowAll={() => setShowAllExp(!showAllExp)}
                  onAddExpClick={handleAddExpClick}
                  onEditExpClick={handleEditExpClick}
                  onDeleteExpClick={handleDeleteExpClick}
                  formatDateStr={formatDateStr}
                />
              </div>

              {/* Right Column: Personal Information Grid */}
              <div className="profile-right-col">
                <ProfileInfoGrid
                  loading={loading}
                  profileInfo={profileInfo}
                  onAddField={handleAddField}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Modals */}
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
