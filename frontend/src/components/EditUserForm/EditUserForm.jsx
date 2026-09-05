import AppDatePicker from "../AppDatePicker/AppDatePicker";
import CustomSelect from "../CustomSelect/CustomSelect";

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function EditUserForm({
  formData,
  errors,
  handleChange,
  handleSubmit,
  submitText = "Save Changes",
  onCancel,
  loading,
  currentImage,
  variant = "profile",
}) {
  const avatarImageSrc =
    formData.profilephoto instanceof File
      ? URL.createObjectURL(formData.profilephoto)
      : currentImage;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={`edit-user-form ${variant}`}
    >
      <div className="form-split-container">
        {/* ── LEFT SIDE COLUMN: Profile Details & Picture (~30% / 290px) ── */}
        <div className="left-profile-column">
          <div className="section-header-wrap">
            <h3 className="section-main-title">Profile Details</h3>
          </div>

          <div className="left-card-box">
            <span className="left-card-subtitle">Profile Picture</span>

            <div className="avatar-card-banner">
              <div className="avatar-circle-wrapper">
                {avatarImageSrc ? (
                  <img
                    src={avatarImageSrc}
                    alt="Avatar"
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = "flex";
                      }
                    }}
                  />
                ) : null}
                <div
                  className="avatar-placeholder-svg"
                  style={{
                    display: avatarImageSrc ? "none" : "flex",
                  }}
                >
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>

              {/* User Name & Email display below photo */}
              <div className="avatar-user-info">
                <h5 className="avatar-user-name">
                  {formData.name || "User Name"}
                </h5>
                <p className="avatar-user-email">
                  {formData.email || "user@example.com"}
                </p>
              </div>
            </div>

            <div className="avatar-actions-row">
              <label htmlFor="profilephoto" className="btn-update-picture">
                <svg
                  width="13"
                  height="13"
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
                Update Picture
              </label>
              <button
                type="button"
                className="btn-remove-picture"
                onClick={() =>
                  handleChange({ target: { name: "profilephoto", value: "" } })
                }
                title="Remove profile picture"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Remove
              </button>
            </div>

            <input
              type="file"
              id="profilephoto"
              name="profilephoto"
              accept="image/*"
              className="hidden-file-input"
              onChange={handleChange}
              disabled={loading}
            />

            {errors.profilephoto && (
              <span className="form-error">{errors.profilephoto}</span>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDE COLUMN: Personal Information, Bio, Location (~70%) ── */}
        <div className="right-fields-column">
          <div className="section-header-wrap">
            <h3 className="section-main-title">Personal Information</h3>
          </div>

          {/* Unified Compact 2-Columns Grid for All Fields */}
          <div className="fields-grid-2col">
            {/* Row 1: Name & Email */}
            <div className="form-field">
              <label className="form-label" htmlFor="name">
                Full Name
              </label>
              <input
                className="form-input"
                type="text"
                id="name"
                name="name"
                maxLength={50}
                value={formData.name}
                placeholder="John Doe"
                onChange={handleChange}
                disabled={loading}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                className={`form-input ${errors.email ? "input-error" : ""}`}
                type="email"
                id="email"
                name="email"
                value={formData.email}
                placeholder="john.doe@example.com"
                onChange={handleChange}
                disabled={loading}
              />
              {errors.email && (
                <span className="form-error">{errors.email}</span>
              )}
            </div>

            {/* Row 2: Phone & Date of Birth */}
            <div className="form-field form-field-phone">
              <label className="form-label" htmlFor="phone">
                Phone
              </label>
              <input
                className="form-input"
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                placeholder="9876543210"
                onChange={handleChange}
                disabled={loading}
              />
              {errors.phone && (
                <span className="form-error">{errors.phone}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="dob">
                Date of Birth
              </label>
              <AppDatePicker
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                disabled={loading}
                maxDate={new Date()}
                placeholderText="DD / MM / YYYY"
                error={!!errors.dob}
              />
              {errors.dob && <span className="form-error">{errors.dob}</span>}
            </div>

            {/* Row 3: Gender & Country */}
            <div className="form-field">
              <label className="form-label" htmlFor="gender">
                Gender
              </label>
              <CustomSelect
                id="gender"
                name="gender"
                value={formData.gender}
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
              {errors.gender && (
                <span className="form-error">{errors.gender}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="country">
                Country
              </label>
              <div className="readonly-input-wrap">
                <input
                  className="form-input readonly-input"
                  type="text"
                  id="country"
                  name="country"
                  value="India"
                  readOnly
                  disabled
                  title="Country cannot be changed"
                />
                <span
                  className="readonly-lock-icon"
                  title="Country cannot be changed"
                  aria-label="Country cannot be changed"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Row 4: State & City */}
            <div className="form-field">
              <label className="form-label" htmlFor="state">
                State
              </label>
              <input
                className="form-input"
                type="text"
                id="state"
                name="state"
                value={formData.state}
                placeholder="e.g. Gujarat"
                onChange={handleChange}
                disabled={loading}
              />
              {errors.state && (
                <span className="form-error">{errors.state}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="city">
                City
              </label>
              <input
                className="form-input"
                type="text"
                id="city"
                name="city"
                value={formData.city}
                placeholder="e.g. Ahmedabad"
                onChange={handleChange}
                disabled={loading}
              />
              {errors.city && <span className="form-error">{errors.city}</span>}
            </div>

            {/* Row 5: Bio in Full Width */}
            <div className="form-field form-field-full">
              <div className="label-counter-row">
                <label className="form-label" htmlFor="bio">
                  Bio
                </label>
                <span className="char-counter">
                  {(formData.bio || "").length}/250
                </span>
              </div>
              <textarea
                className="form-input bio-textarea"
                id="bio"
                name="bio"
                rows="2"
                maxLength={250}
                value={formData.bio}
                placeholder="Tell us something about yourself..."
                onChange={handleChange}
                disabled={loading}
              />
              {errors.bio && <span className="form-error">{errors.bio}</span>}
            </div>
          </div>

          {/* Bottom Actions: [ Cancel ] [ Save Changes ] */}
          <div className="right-form-actions">
            <button
              type="button"
              className="btn btn-secondary-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary-save"
              disabled={loading}
            >
              {loading ? <><Spinner /> Saving...</> : submitText}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default EditUserForm;
