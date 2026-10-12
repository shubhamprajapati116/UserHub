import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppDatePicker from "../AppDatePicker/AppDatePicker";
import CustomSelect from "../CustomSelect/CustomSelect";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiGlobe,
  FiMapPin,
  FiMap,
  FiLock,
  FiCamera,
  FiTrash2,
  FiCheckCircle,
  FiShield,
} from "react-icons/fi";
import ImageCropperModal from "../ImageCropper/ImageCropperModal";
import "./EditUserForm.css";

function Spinner() {
  return (
    <svg
      className="btn-spinner"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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

function EditUserForm({
  formData,
  errors = {},
  handleChange,
  handleSubmit,
  submitText = "Save Changes",
  onCancel,
  loading = false,
  currentImage,
  variant = "profile",
}) {
  const navigate = useNavigate();
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState("");

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImageSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = (croppedFile) => {
    setAvatarLoadFailed(false);
    handleChange({
      target: {
        name: "profilephoto",
        value: croppedFile,
      },
    });
    handleChange({
      target: {
        name: "removePhoto",
        value: false,
      },
    });
    setShowCropper(false);
  };

  const handleRemovePhoto = () => {
    setAvatarLoadFailed(false);
    handleChange({
      target: {
        name: "profilephoto",
        value: "",
      },
    });
    handleChange({
      target: {
        name: "removePhoto",
        value: true,
      },
    });
  };

  const isRemoved =
    formData.removePhoto === true ||
    formData.removePhoto === "true" ||
    formData.profilephoto === "";

  let avatarImageSrc = null;
  if (!isRemoved) {
    if (formData.profilephoto instanceof File) {
      avatarImageSrc = URL.createObjectURL(formData.profilephoto);
    } else if (
      formData.profilephoto &&
      typeof formData.profilephoto === "string"
    ) {
      avatarImageSrc = formData.profilephoto.startsWith("http")
        ? formData.profilephoto
        : `${import.meta.env.VITE_API_URL}/uploads/${formData.profilephoto}`;
    } else if (currentImage) {
      avatarImageSrc = currentImage.startsWith("http")
        ? currentImage
        : `${import.meta.env.VITE_API_URL}/uploads/${currentImage}`;
    }
  }

  const hasPhoto = Boolean(avatarImageSrc);

  const initials = (formData.name || "User")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const bioLength = (formData.bio || "").length;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={`edit-user-form ${variant}`}
    >
      <div className="euf-container">
        <div className="euf-identity-card">
          <div className="euf-ambient-glow" />

          <div className="euf-avatar-wrapper">
            <div className="euf-avatar-ring">
              {avatarImageSrc && !avatarLoadFailed ? (
                <img
                  src={avatarImageSrc}
                  alt={formData.name || "Profile Avatar"}
                  className="euf-avatar-img"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <div className="euf-avatar-fallback">
                  {initials.length > 0 ? initials : <FiUser size={28} />}
                </div>
              )}
              <span className="euf-online-dot" title="Active Account" />
            </div>
          </div>

          <div className="euf-identity-info">
            <h3 className="euf-user-name" title={formData.name || "User Name"}>
              {formData.name || "User Name"}
            </h3>
            <p className="euf-user-email" title={formData.email || "user@example.com"}>
              {formData.email || "user@example.com"}
            </p>
            <div className="euf-account-badge-wrap">
              <span className={`euf-account-badge ${variant === "admin" ? "admin" : "personal"}`}>
                <FiShield size={10} />
                {variant === "admin" ? "Managed User" : "Personal Profile"}
              </span>
            </div>
          </div>

          <div className="euf-actions-wrapper">
            <div className="euf-photo-actions">
              <label htmlFor="profilephoto" className="euf-btn-upload">
                <FiCamera size={13} />
                <span>{hasPhoto ? "Change Photo" : "Upload Photo"}</span>
              </label>

              {hasPhoto && (
                <button
                  type="button"
                  className="euf-btn-remove"
                  onClick={handleRemovePhoto}
                  title="Remove profile picture"
                  disabled={loading}
                >
                  <FiTrash2 size={13} />
                  <span>Remove</span>
                </button>
              )}

              <input
                type="file"
                id="profilephoto"
                name="profilephoto"
                accept="image/*"
                className="euf-hidden-file-input"
                onChange={handlePhotoSelect}
                disabled={loading}
              />
            </div>

            {errors.profilephoto && (
              <span className="euf-error-text euf-avatar-error">
                {errors.profilephoto}
              </span>
            )}

            <span className="euf-format-hint">
              JPG, PNG, WebP (max 5MB)
            </span>
          </div>
        </div>

        <div className="euf-form-card">
          <div className="euf-card-header">
            <div className="euf-header-left">
              <div className="euf-header-icon personal">
                <FiUser size={13} />
              </div>
              <h4 className="euf-card-title">Personal Information</h4>
            </div>
            <span className="euf-section-badge">General Details</span>
          </div>

          <div className="euf-form-body">
            <div className="euf-fields-grid">
              <div className="euf-field-group">
                <div className="euf-field-label-row">
                  <label className="euf-field-label" htmlFor="name">
                    Full Name <span className="euf-required">*</span>
                  </label>
                </div>
                <div className={`euf-input-wrap ${errors.name ? "has-error" : ""}`}>
                  <span className="euf-input-icon">
                    <FiUser size={13} />
                  </span>
                  <input
                    className="euf-input"
                    type="text"
                    id="name"
                    name="name"
                    maxLength={50}
                    value={formData.name || ""}
                    placeholder="John Doe"
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.name && (
                  <span className="euf-error-text">{errors.name}</span>
                )}
              </div>

              <div className="euf-field-group">
                <div className="euf-field-label-row">
                  <label className="euf-field-label" htmlFor="email">
                    Email Address <span className="euf-required">*</span>
                  </label>
                  {variant === "profile" && (
                    <span className="euf-badge-verified">
                      <FiCheckCircle size={11} /> Primary & Verified
                    </span>
                  )}
                </div>
                <div
                  className={`euf-input-wrap ${variant === "profile" ? "euf-input-locked" : ""} ${errors.email ? "has-error" : ""}`}
                >
                  <span className="euf-input-icon">
                    {variant === "profile" ? <FiLock size={13} /> : <FiMail size={13} />}
                  </span>
                  <input
                    className={`euf-input ${variant === "profile" ? "readonly" : ""}`}
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || ""}
                    placeholder="john.doe@example.com"
                    onChange={handleChange}
                    readOnly={variant === "profile"}
                    disabled={loading || variant === "profile"}
                  />
                  {variant === "profile" && (
                    <button
                      type="button"
                      className="euf-inline-change-btn"
                      onClick={() =>
                        navigate("/settings?tab=security", {
                          state: { openEmailModal: true },
                        })
                      }
                      title="Change email in Security Settings"
                    >
                      Change &rarr;
                    </button>
                  )}
                </div>
                {errors.email && variant !== "profile" && (
                  <span className="euf-error-text">{errors.email}</span>
                )}
              </div>
            </div>

            <div className="euf-fields-grid trio">
              <div className="euf-field-group">
                <label className="euf-field-label" htmlFor="phone">
                  Phone
                </label>
                <div className={`euf-input-wrap ${errors.phone ? "has-error" : ""}`}>
                  <span className="euf-input-icon">
                    <FiPhone size={13} />
                  </span>
                  <input
                    className="euf-input"
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    placeholder="9876543210"
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.phone && (
                  <span className="euf-error-text">{errors.phone}</span>
                )}
              </div>

              <div className="euf-field-group">
                <label className="euf-field-label" htmlFor="dob">
                  Date of Birth
                </label>
                <div className="euf-picker-wrap">
                  <AppDatePicker
                    id="dob"
                    name="dob"
                    value={formData.dob || ""}
                    onChange={handleChange}
                    disabled={loading}
                    maxDate={new Date()}
                    placeholderText="DD / MM / YYYY"
                    error={!!errors.dob}
                  />
                </div>
                {errors.dob && (
                  <span className="euf-error-text">{errors.dob}</span>
                )}
              </div>

              <div className="euf-field-group">
                <label className="euf-field-label" htmlFor="gender">
                  Gender
                </label>
                <div className="euf-select-wrap">
                  <CustomSelect
                    id="gender"
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Select gender"
                    error={!!errors.gender}
                    options={[
                      { label: "Male", value: "male" },
                      { label: "Female", value: "female" },
                      { label: "Other", value: "other" },
                    ]}
                  />
                </div>
                {errors.gender && (
                  <span className="euf-error-text">{errors.gender}</span>
                )}
              </div>
            </div>

            <div className="euf-fields-grid trio">
              <div className="euf-field-group">
                <label className="euf-field-label" htmlFor="country">
                  <span>Country</span>
                  <span className="euf-locked-badge">
                    <FiLock size={9} /> Fixed
                  </span>
                </label>
                <div className="euf-input-wrap readonly">
                  <span className="euf-input-icon">
                    <FiGlobe size={13} />
                  </span>
                  <input
                    className="euf-input readonly-input"
                    type="text"
                    id="country"
                    name="country"
                    value="India"
                    readOnly
                    disabled
                    title="Country is fixed to India"
                  />
                  <span className="euf-input-trail-icon" title="Fixed Country">
                    <FiLock size={12} />
                  </span>
                </div>
              </div>

              <div className="euf-field-group">
                <label className="euf-field-label" htmlFor="state">
                  State
                </label>
                <div className={`euf-input-wrap ${errors.state ? "has-error" : ""}`}>
                  <span className="euf-input-icon">
                    <FiMap size={13} />
                  </span>
                  <input
                    className="euf-input"
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state || ""}
                    placeholder="e.g. Gujarat"
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.state && (
                  <span className="euf-error-text">{errors.state}</span>
                )}
              </div>

              <div className="euf-field-group">
                <label className="euf-field-label" htmlFor="city">
                  City
                </label>
                <div className={`euf-input-wrap ${errors.city ? "has-error" : ""}`}>
                  <span className="euf-input-icon">
                    <FiMapPin size={13} />
                  </span>
                  <input
                    className="euf-input"
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city || ""}
                    placeholder="e.g. Visnagar"
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.city && (
                  <span className="euf-error-text">{errors.city}</span>
                )}
              </div>
            </div>

            <div className="euf-field-group">
              <div className="euf-label-with-badge">
                <label className="euf-field-label" htmlFor="bio">
                  Bio
                </label>
                <span className={`euf-char-counter ${bioLength >= 240 ? "warning" : ""}`}>
                  {bioLength} / 250
                </span>
              </div>
              <div className="euf-textarea-container">
                <textarea
                  className={`euf-textarea ${errors.bio ? "has-error" : ""}`}
                  id="bio"
                  name="bio"
                  rows="2"
                  maxLength={250}
                  value={formData.bio || ""}
                  placeholder="Tell us something about yourself..."
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.bio && (
                <span className="euf-error-text">{errors.bio}</span>
              )}
            </div>
          </div>

          <div className="euf-card-footer">
            <div className="euf-action-notice">
              <FiCheckCircle size={13} />
              <span>
                {variant === "admin"
                  ? "Updates apply immediately to the user account"
                  : "Updates apply immediately to your profile"}
              </span>
            </div>

            <div className="euf-action-buttons">
              <button
                type="button"
                className="euf-btn-cancel"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="euf-btn-save"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{submitText}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCropper && (
        <ImageCropperModal
          imageSrc={cropperImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropper(false)}
          loading={loading}
        />
      )}
    </form>
  );
}

export default EditUserForm;
