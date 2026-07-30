import { Link } from "react-router-dom";
import PasswordInput from "../PasswordInput/passwordinput";


function UserFormFields({
  formData,
  errors,
  handleChange,
  handleSubmit,
  showLoginLink = false,
  showCancelButton = false,
  onCancel,
  buttontext,
  loadingtext,
  loading,
}) {
  return (
    <form noValidate onSubmit={handleSubmit} className="register-form">
      <div className="form-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="name">
            Full name
          </label>

          <input
            className="form-input"
            maxLength={50}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            placeholder="John Doe"
            onChange={handleChange}
             disabled={loading}
          />

          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="email">
            Email address
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
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="password">
          Password
        </label>

        <PasswordInput
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Minimum 8 characters"
          error={errors.password}
          disabled={loading}
        />
      </div>

      <div className="form-grid">
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

          {errors.gender && <span className="form-error">{errors.gender}</span>}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="dob">
            Date of birth
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
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="profilephoto">
          Profile photo
        </label>

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

      <div className="form-actions">
        {showCancelButton && (
          <button
            type="button"
            className="btn btn-outline register-submit"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? loadingtext : buttontext}
        </button>
      </div>

      {showLoginLink && (
        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Sign in</Link>
        </div>
      )}
    </form>
  );
}

export default UserFormFields;
