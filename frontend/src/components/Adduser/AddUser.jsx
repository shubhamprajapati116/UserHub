/* eslint-disable react-refresh/only-export-components */
import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { observer } from "mobx-react-lite";
import AppLayout from "../AppLayout/AppLayout";
import AppDatePicker from "../AppDatePicker/AppDatePicker";
import CustomSelect from "../CustomSelect/CustomSelect";
import ImageCropperModal from "../ImageCropper/ImageCropperModal";
import { validateUserForm } from "../../utils/validateUserForm";
import useUserForm from "../../hooks/userUserform";
import { useStore } from "../../stores/StoreContext";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCamera,
  FiTrash2,
  FiShield,
  FiUserPlus,
  FiCheckCircle,
} from "react-icons/fi";
import "./AddUser.css";

function Spinner() {
  return (
    <svg
      className="btn-spinner"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: 14,
        height: 14,
        animation: "aufSpin 0.8s linear infinite",
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AddUser() {
  const navigate = useNavigate();
  const { userStore } = useStore();
  const fileInputRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [cropperSrc, setCropperSrc] = useState("");
  const [showCropper, setShowCropper] = useState(false);

  const { formData, setFormData, errors, setErrors, handleChange } =
    useUserForm({
      name: "",
      email: "",
      password: "",
      gender: "",
      dob: "",
      profilephoto: "",
    });

  // Calculate initials from name for avatar preview fallback
  const initials = useMemo(() => {
    return (formData.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [formData.name]);

  // Object URL for live photo preview
  const photoPreviewUrl = useMemo(() => {
    if (formData.profilephoto instanceof File) {
      return URL.createObjectURL(formData.profilephoto);
    }
    return "";
  }, [formData.profilephoto]);

  // Handle Photo Picker Selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Open cropper for selected photo
    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handle Cropper Completion
  const handleCropComplete = (croppedFile) => {
    setFormData((prev) => ({
      ...prev,
      profilephoto: croppedFile,
    }));
    if (errors.profilephoto) {
      setErrors((prev) => ({
        ...prev,
        profilephoto: "",
      }));
    }
    setShowCropper(false);
  };

  // Remove Photo
  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      profilephoto: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = validateUserForm(formData, {
      requirePassword: true,
      requireProfilePhoto: true,
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    try {
      const formDataObj = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });

      const data = await userStore.addUser(formDataObj);
      toast.success(data?.message || "User created successfully!");

      if (userStore.fetchUsers) {
        userStore.fetchUsers();
      }

      navigate("/admin/users");
    } catch (error) {
      if (error?.field) {
        setErrors({
          [error.field]: error.message,
        });
      } else if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to add user");
      }
    }
  };

  return (
    <AppLayout
      title="Add User"
      subtitle="Create and configure a new user account"
      breadcrumbs={[
        { label: "User Management", path: "/admin/users" },
        { label: "Add User" },
      ]}
    >
      <div className="add-user-page-wrapper">
        <form noValidate onSubmit={handleSubmit} className="auf-card">
          {/* Header */}
          <div className="auf-header">
            <div className="auf-header-left">
              <div className="auf-header-icon-box">
                <FiUserPlus size={20} />
              </div>
              <div className="auf-header-text">
                <h3>Create New User</h3>
                <p>Fill in the details below to register a new user in the directory.</p>
              </div>
            </div>
            <span className="auf-header-badge">Required Fields *</span>
          </div>

          {/* Form Body */}
          <div className="auf-body">
            {/* ── 1. AVATAR UPLOAD WIDGET ── */}
            <div className="auf-avatar-section">
              <div
                className="auf-avatar-wrapper"
                onClick={() => fileInputRef.current?.click()}
                title="Click to select profile photo"
              >
                <div className="auf-avatar-ring">
                  {photoPreviewUrl ? (
                    <img
                      src={photoPreviewUrl}
                      alt={formData.name || "User Avatar"}
                      className="auf-avatar-img"
                    />
                  ) : (
                    <div className="auf-avatar-placeholder">
                      {initials ? (
                        <span className="auf-avatar-initials">{initials}</span>
                      ) : (
                        <FiCamera size={26} />
                      )}
                    </div>
                  )}
                </div>
                <div className="auf-avatar-camera-badge" title="Upload Photo">
                  <FiCamera size={13} />
                </div>
              </div>

              <div className="auf-avatar-details">
                <div className="auf-avatar-label-row">
                  <h4 className="auf-avatar-title">
                    Profile Picture <span className="auf-req">*</span>
                  </h4>
                  <span className="auf-avatar-meta-hint">
                    JPG, PNG, WebP (max 5MB)
                  </span>
                </div>
                <p className="auf-avatar-desc">
                  Choose a picture to represent this user across the platform.
                </p>

                <div className="auf-avatar-actions-row">
                  <button
                    type="button"
                    className="auf-btn-photo-upload"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={userStore.loading.addUser}
                  >
                    <FiCamera size={13} />
                    <span>
                      {formData.profilephoto ? "Change Photo" : "Upload Photo"}
                    </span>
                  </button>

                  {Boolean(formData.profilephoto) && (
                    <button
                      type="button"
                      className="auf-btn-photo-remove"
                      onClick={handleRemovePhoto}
                      title="Remove selected picture"
                      disabled={userStore.loading.addUser}
                    >
                      <FiTrash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {errors.profilephoto && (
                  <span className="auf-error">{errors.profilephoto}</span>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  id="profilephoto"
                  name="profilephoto"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoSelect}
                  disabled={userStore.loading.addUser}
                />
              </div>
            </div>

            {/* ── 2. UNIFIED FORM FIELDS GRID (Clean, Continuous Flow) ── */}
            <div className="auf-fields-grid">
              {/* Full Name */}
              <div className="auf-field-group">
                <label className="auf-label" htmlFor="name">
                  <span>Full Name <span className="auf-req">*</span></span>
                </label>
                <div className={`auf-input-wrap ${errors.name ? "has-error" : ""}`}>
                  <span className="auf-input-icon">
                    <FiUser size={14} />
                  </span>
                  <input
                    className="auf-input"
                    type="text"
                    id="name"
                    name="name"
                    maxLength={50}
                    value={formData.name}
                    placeholder="e.g. John Doe"
                    onChange={handleChange}
                    disabled={userStore.loading.addUser}
                  />
                </div>
                {errors.name && <span className="auf-error">{errors.name}</span>}
              </div>

              {/* Email Address */}
              <div className="auf-field-group">
                <label className="auf-label" htmlFor="email">
                  <span>Email Address <span className="auf-req">*</span></span>
                </label>
                <div className={`auf-input-wrap ${errors.email ? "has-error" : ""}`}>
                  <span className="auf-input-icon">
                    <FiMail size={14} />
                  </span>
                  <input
                    className="auf-input"
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    placeholder="e.g. john.doe@gmail.com"
                    onChange={handleChange}
                    disabled={userStore.loading.addUser}
                  />
                </div>
                {errors.email && <span className="auf-error">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="auf-field-group">
                <label className="auf-label" htmlFor="password">
                  <span>Password <span className="auf-req">*</span></span>
                </label>
                <div className={`auf-input-wrap ${errors.password ? "has-error" : ""}`}>
                  <span className="auf-input-icon">
                    <FiLock size={14} />
                  </span>
                  <input
                    className="auf-input"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    placeholder="Minimum 8 characters"
                    onChange={handleChange}
                    disabled={userStore.loading.addUser}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auf-pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    title={showPassword ? "Hide password" : "Show password"}
                    disabled={userStore.loading.addUser}
                  >
                    {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
                {errors.password ? (
                  <span className="auf-error">{errors.password}</span>
                ) : (
                  <span className="auf-hint">Must contain at least 8 characters</span>
                )}
              </div>

              {/* Date of Birth */}
              <div className="auf-field-group">
                <label className="auf-label" htmlFor="dob">
                  <span>Date of Birth <span className="auf-req">*</span></span>
                </label>
                <div className="auf-picker-wrap">
                  <AppDatePicker
                    id="dob"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    disabled={userStore.loading.addUser}
                    maxDate={new Date()}
                    placeholderText="DD / MM / YYYY"
                    error={!!errors.dob}
                  />
                </div>
                {errors.dob && <span className="auf-error">{errors.dob}</span>}
              </div>

              {/* Gender */}
              <div className="auf-field-group">
                <label className="auf-label" htmlFor="gender">
                  <span>Gender <span className="auf-req">*</span></span>
                </label>
                <div className="auf-select-wrap">
                  <CustomSelect
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={userStore.loading.addUser}
                    placeholder="Select gender"
                    error={!!errors.gender}
                    options={[
                      { label: "Male", value: "male" },
                      { label: "Female", value: "female" },
                      { label: "Other", value: "other" },
                    ]}
                  />
                </div>
                {errors.gender && <span className="auf-error">{errors.gender}</span>}
              </div>

              {/* System Role */}
              <div className="auf-field-group">
                <label className="auf-label" htmlFor="assigned-role">
                  <span>System Role</span>
                </label>
                <div className="auf-input-wrap readonly">
                  <span className="auf-input-icon">
                    <FiShield size={14} />
                  </span>
                  <input
                    className="auf-input readonly-input"
                    type="text"
                    id="assigned-role"
                    value="Standard User"
                    readOnly
                    disabled
                    title="Default role for newly created accounts"
                  />
                  <span className="auf-trail-icon" title="Fixed upon creation">
                    <FiLock size={13} />
                  </span>
                </div>
                <span className="auf-hint">
                  Role can be promoted to Admin anytime from directory
                </span>
              </div>
            </div>
          </div>

          {/* ── Card Footer ── */}
          <div className="auf-footer">
            <div className="auf-footer-notice">
              <FiCheckCircle size={15} />
              <span>Account will be pre-verified by administrator</span>
            </div>

            <div className="auf-footer-actions">
              <button
                type="button"
                className="auf-btn-cancel"
                onClick={() => navigate("/admin/users")}
                disabled={userStore.loading.addUser}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="auf-btn-submit"
                disabled={userStore.loading.addUser}
              >
                {userStore.loading.addUser ? (
                  <>
                    <Spinner /> Creating User...
                  </>
                ) : (
                  <>
                    <FiUserPlus size={15} /> Add User
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Profile Photo Cropper Modal */}
      {showCropper && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropper(false)}
          loading={false}
        />
      )}
    </AppLayout>
  );
}

export default observer(AddUser);
