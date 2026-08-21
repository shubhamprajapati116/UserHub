import AppDatePicker from "../AppDatePicker/AppDatePicker";
import CustomSelect from "../CustomSelect/CustomSelect";

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
        {/* ── LEFT SIDE COLUMN: Profile Details & Picture ── */}
        <div className="left-profile-column">
          <h4 className="left-card-title">Profile Details</h4>
          <div className="left-card-divider" />

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
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
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

        {/* ── RIGHT SIDE COLUMN: Personal Information, Bio, Location ── */}
        <div className="right-fields-column">
          <div className="right-section-header">
            <h3>Personal Information</h3>
            <div className="section-blue-line" />
          </div>

          <div className="right-section-subtitle">Personal Details</div>

          {/* 1. Name & Email in 2-Columns */}
          <div className="fields-grid-2col">
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
                className="form-input"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                placeholder="john.doe@notion.com"
                onChange={handleChange}
                disabled={loading}
              />
              {errors.email && (
                <span className="form-error">{errors.email}</span>
              )}
            </div>
          </div>

          {/* 2. Gender, Date of Birth & Phone in 3-Columns (Desktop/Tablet) / 2-Columns (Mobile) */}
          <div className="fields-grid-3col" style={{ marginTop: "10px" }}>
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
          </div>

          {/* 3. Bio in Full Width with Character Counter */}
          <div
            className="form-field form-field-full"
            style={{ marginTop: "10px" }}
          >
            <div className="label-counter-row">
              <label className="form-label" htmlFor="bio">
                Bio
              </label>
              <span className="char-counter">
                {(formData.bio || "").length}/250
              </span>
            </div>
            <textarea
              className="form-input compact-textarea"
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

          {/* 4. Location Section */}
          <div className="sub-section-divider" />
          <div className="right-section-subtitle">Location</div>

          <div className="fields-grid-3col location-grid">
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
                  title="Service available for India only"
                />
                <span className="readonly-lock-icon">🔒</span>
              </div>
            </div>

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
          </div>

          {/* Bottom Actions */}
          <div className="right-form-actions">
            <button
              type="submit"
              className="btn btn-primary-save"
              disabled={loading}
            >
              {loading ? "Saving..." : submitText}
            </button>
            <button
              type="button"
              className="btn btn-secondary-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default EditUserForm;
