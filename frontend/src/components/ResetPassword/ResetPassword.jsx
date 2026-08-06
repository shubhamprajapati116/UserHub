/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../ForgotPassword/forgotpassword.css";
import { toast } from "react-toastify";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import AuthBrandPanel from "../AuthBrandPanel/AuthBrandPanel";

function ResetPassword() {
  const { token } = useParams();
  const { userStore } = useStore();
  const loading = userStore.loading.resetPassword;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");

    try {
      const data = await userStore.resetPassword(token, formData.password);

      toast.success(data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      if (error?.field) {
        setError(error.message);
      } else {
        toast.error(error?.message || "Failed to reset password");
      }
    }
  };

  return (
    <div className="auth-split">
      <AuthBrandPanel
        title="Create a new password"
        subtitle="Choose a strong password to keep your account secure. Use at least 8 characters with a mix of letters and numbers."
        type="login"
      />

      <div className="auth-split-form">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">U</div>
            <span>UserHub</span>
          </div>

          <h2>Set new password</h2>
          <p className="auth-subtitle">Enter your new password below.</p>

          <form noValidate onSubmit={handleSubmit}>
            <label className="form-label" htmlFor="password">
              New Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
              disabled={loading}
            />

            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              className="form-input"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              disabled={loading}
            />

            {error && <span className="form-error">{error}</span>}

            <button
              type="submit"
              className="btn btn-primary btn-full reset-btn"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <div className="auth-footer">
              <Link to="/login">Back to Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default observer(ResetPassword);
