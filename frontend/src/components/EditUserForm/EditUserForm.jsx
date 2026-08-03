function EditUserForm({
  formData,
  errors,
  handleChange,
  handleSubmit,
  submitText,
  onCancel,
  loading,
  currentImage,
  variant,
}) {
  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={`edit-user-form ${variant}`}
    >
      <section className="edit-form-section">
        <div className="edit-form-section-header">
          <h3>Profile Photo</h3>
          <p>Upload a new profile picture.</p>
        </div>

        <div className="profile-upload-container">
          <div className="profile-preview">
            {currentImage ? (
              <img
                src={
                  formData.profilephoto instanceof File
                    ? URL.createObjectURL(formData.profilephoto)
                    : currentImage
                }
                alt="Profile"
              />
            ) : (
              <div className="profile-placeholder">No Photo</div>
            )}
          </div>

          <div className="profile-upload-content">
            <label className="form-label" htmlFor="profilephoto">
              Choose New Photo
            </label>
            <p className="upload-helper">PNG, JPG up to 5MB</p>
            <input
              className="form-input"
              type="file"
              id="profilephoto"
              name="profilephoto"
              accept="image/*"
              onChange={handleChange}
              disabled={loading}
            />

            {errors.profilephoto && (
              <span className="form-error">{errors.profilephoto}</span>
            )}
          </div>
        </div>
      </section>
      <section className="edit-form-section">
        <div className="edit-form-section-header">
          <h3>Personal Information</h3>
          <p>Basic details about the user.</p>
        </div>

        <div className="edit-form-grid">
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
              placeholder="you@gmail.com"
              onChange={handleChange}
              disabled={loading}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="gender">
              Gender
            </label>

            <select
              className="form-select"
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && (
              <span className="form-error">{errors.gender}</span>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="dob">
              Date of Birth
            </label>

            <input
              className="form-input"
              type="date"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              disabled={loading}
            />

            {errors.dob && <span className="form-error">{errors.dob}</span>}
          </div>

          <div className="form-field">
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

            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>
        </div>
      </section>

      <section className="edit-form-section">
        <div className="edit-form-section-header">
          <h3>Location</h3>
          <p>User location information.</p>
        </div>

        <div className="edit-form-grid">
          <div className="form-field">
            <label className="form-label" htmlFor="country">
              Country
            </label>

            <input
              className="form-input"
              type="text"
              id="country"
              name="country"
              value={formData.country}
              placeholder="India"
              onChange={handleChange}
              disabled={loading}
            />

            {errors.country && (
              <span className="form-error">{errors.country}</span>
            )}
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

            {errors.state && <span className="form-error">{errors.state}</span>}
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
      </section>

      <section className="edit-form-section">
        <div className="edit-form-section-header">
          <h3>About</h3>
          <p>Additional profile information.</p>
        </div>

        <div className="form-field form-field-full">
          <label className="form-label" htmlFor="bio">
            Bio
          </label>

          <textarea
            className="form-input"
            id="bio"
            name="bio"
            rows="5"
            maxLength={250}
            value={formData.bio}
            placeholder="Tell us something about yourself..."
            onChange={handleChange}
            disabled={loading}
          />

          {errors.bio && <span className="form-error">{errors.bio}</span>}
        </div>
      </section>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-outline register-submit"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="btn btn-primary register-submit"
          disabled={loading}
        >
          {loading ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
}

export default EditUserForm;
