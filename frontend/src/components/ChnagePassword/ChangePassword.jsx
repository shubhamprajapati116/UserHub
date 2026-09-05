/* eslint-disable react-refresh/only-export-components */
import AppLayout from "../AppLayout/AppLayout";
import "./ChangePassword.css";
import { useState,useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PasswordInput from "../PasswordInput/passwordinput";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

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

  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const userEmail = userStore.currentUser?.email || "";

  useEffect(() => {
    if (!resetSent || resendTimer === 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resetSent, resendTimer]);

  const handleSendResetEmail = async () => {
    if (!userEmail || resetLoading) return;
    setResetLoading(true);
    try {
      const data = await userStore.forgotPassword(userEmail);
      toast.success(data?.message || "Password reset link sent to your email!");
      setResetSent(true);
      setResendTimer(60);
      setIsForgotOpen(true);
    } catch (err) {
      toast.error(err?.message || "Failed to send reset link");
    } finally {
      setResetLoading(false);
    }
  };

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
    <AppLayout
      title="Change Password"
      subtitle="Update your account password and security settings"
      breadcrumbs={[
        { label: "Settings", path: "/settings" },
        { label: "Change Password" },
      ]}
    >
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
                <div className="form-group-compact">
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
                </div>

                <div className="form-group-compact">
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
                </div>

                <div className="form-group-compact">
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
                </div>

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
                    {loading ? <><Spinner /> Changing...</> : "Change Password"}
                  </button>
                </div>
              </form>

              {/* ── In-App Collapsible Forgot Password Dropdown Box ── */}
              <div className={`forgot-password-prompt-box ${isForgotOpen ? "is-open" : ""}`}>
                <div
                  className="prompt-toggle-header"
                  onClick={() => setIsForgotOpen(!isForgotOpen)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsForgotOpen(!isForgotOpen);
                    }
                  }}
                  title={isForgotOpen ? "Click to collapse" : "Click to expand forgot password options"}
                >
                  <div className="prompt-header-left">
                    <div className="prompt-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </div>
                    <span className="prompt-header-title">
                      Forgot your current password?
                    </span>
                  </div>

                  <button
                    type="button"
                    className="prompt-chevron-btn"
                    aria-label={isForgotOpen ? "Collapse" : "Expand"}
                    tabIndex={-1}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`prompt-chevron-icon ${isForgotOpen ? "rotate" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

                {isForgotOpen && (
                  <div className="prompt-collapsible-content">
                    <p className="prompt-desc">
                      Send a secure password reset link to your registered email{" "}
                      {userEmail ? <b>({userEmail})</b> : ""} without leaving this page.
                    </p>

                    {resetSent ? (
                      <div className="reset-sent-badge">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>
                          Reset link sent! Check your inbox.{" "}
                          {resendTimer > 0 ? `(${resendTimer}s)` : ""}
                        </span>
                        {resendTimer === 0 && (
                          <button
                            type="button"
                            className="btn-resend-link"
                            onClick={handleSendResetEmail}
                            disabled={resetLoading}
                          >
                            Resend Link
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-send-reset-link"
                        onClick={handleSendResetEmail}
                        disabled={resetLoading || !userEmail}
                      >
                        {resetLoading ? (
                          <>
                            <Spinner /> Sending reset link...
                          </>
                        ) : (
                          <>
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
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Send Reset Link to Email
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default observer(ChangePassword);
