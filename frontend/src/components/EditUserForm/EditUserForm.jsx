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
                {currentImage || formData.profilephoto instanceof File ? (
                  <img
                    src={
                      formData.profilephoto instanceof File
                        ? URL.createObjectURL(formData.profilephoto)
                        : currentImage
                    }
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
                    display:
                      currentImage || formData.profilephoto instanceof File
                        ? "none"
                        : "flex",
                  }}
                >
                  <svg
                    width="40"
                    height="40"
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
            </div>

            <div className="avatar-actions-row">
              <label htmlFor="profilephoto" className="btn-update-picture">
                Update Picture
              </label>
              <button
                type="button"
                className="btn-remove-picture"
                onClick={() =>
                  handleChange({ target: { name: "profilephoto", value: "" } })
                }
              >
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

          {/* 2-Column Fields Grid */}
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
                placeholderText="Select date of birth"
                error={!!errors.dob}
              />
              {errors.dob && <span className="form-error">{errors.dob}</span>}
            </div>

            {/* Phone + Bio full width rows */}
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

            {/* Bio in the middle right below personal details */}
            <div className="form-field form-field-full">
              <label className="form-label" htmlFor="bio">
                Bio
              </label>
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
          </div>

          {/* Location below Bio */}
          <div className="sub-section-divider" />
          <div className="right-section-subtitle">Location</div>

          <div className="fields-grid-3col">
            <div className="form-field">
              <label className="form-label" htmlFor="country">
                Country
              </label>
              <input
                className="form-input"
                type="text"
                id="country"
                name="country"
                value="India"
                readOnly
                disabled
                title="Service available for India only"
              />
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
                placeholder="Gujarat"
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
                placeholder="Ahmedabad"
                onChange={handleChange}
                disabled={loading}
              />
              {errors.city && <span className="form-error">{errors.city}</span>}
            </div>
          </div>

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
              className="btn btn-text-cancel"
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
