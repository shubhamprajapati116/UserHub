/* eslint-disable react-refresh/only-export-components */
import AppLayout from "../AppLayout/AppLayout";
import "./ChangePassword.css";
import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PasswordInput from "../PasswordInput/passwordinput";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
function ChangePassword() {
  const { userStore } = useStore();
  const loading = userStore.loading.changePassword;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, seterror] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    seterror({ ...error, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newerror = {};

    if (!formData.currentPassword.trim()) {
      newerror.currentPassword = "Current password is required";
    }
    if (!formData.newPassword.trim()) {
      newerror.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newerror.newPassword = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword.trim()) {
      newerror.confirmPassword = "Confirm password is required";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newerror.confirmPassword = "Passwords do not match";
    }
    seterror(newerror);

    if (Object.keys(newerror).length > 0) return;

    try {
      const data = await userStore.changePassword(formData);
      toast.success(data.message);
      setTimeout(() => navigate("/settings"), 1000);
    } catch (error) {
      if (error?.field) {
        seterror({
          [error.field]: error.message,
        });
      } else if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to change password");
      }
    }
  };

  return (
    <AppLayout title="Change Password" subtitle="Update your account password">
      <div className="page-container-form">
        <div className="settings-grid">
          <div className="card change-password-layout">
            <div className="change-password-body">
              <div className="change-password-info">
                <div className="setting-info-icon security">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h3>Update your password</h3>
                  <p>Ensure your new password is at least 8 characters long.</p>
                </div>
              </div>

              <form className="change-password-form" onSubmit={handleSubmit}>
                <label className="form-label" htmlFor="currentPassword">
                  Current Password
                </label>
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  error={error.currentPassword}
                  disabled={loading}
                />

                <label className="form-label" htmlFor="newPassword">
                  New Password
                </label>
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  error={error.newPassword}
                  disabled={loading}
                />

                <label className="form-label" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-input"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                {error.confirmPassword && (
                  <span className="form-error">{error.confirmPassword}</span>
                )}

                <div className="change-password-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={loading}
                    onClick={() => navigate("/settings")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default observer(ChangePassword);
