/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../ForgotPassword/forgotpassword.css";
import { toast } from "react-toastify";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import PasswordInput from "../PasswordInput/passwordinput";

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

function ResetPassword() {
  const { token } = useParams();
  const { userStore } = useStore();
  const loading = userStore.loading.resetPassword;
  const navigate = useNavigate();

  // 'checking' | 'valid' | 'invalid'
  const [tokenStatus, setTokenStatus] = useState("checking");
  const [invalidReason, setInvalidReason] = useState("");

  // Post-reset success state & redirect countdown
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState(3);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState({});

  // 1️⃣ Check token validity on component mount & on token change
  useEffect(() => {
    let isMounted = true;
    setTokenStatus("checking");
    setInvalidReason("");

    const checkToken = async () => {
      if (!token || !token.trim()) {
        if (isMounted) {
          setTokenStatus("invalid");
          setInvalidReason("No password reset token provided.");
        }
        return;
      }

      try {
        const res = await userStore.verifyResetToken(token.trim());
        if (isMounted) {
          if (res && res.valid === true) {
            setTokenStatus("valid");
          } else {
            setTokenStatus("invalid");
            setInvalidReason(
              res?.message || "This password reset link is invalid or has expired.",
            );
          }
        }
      } catch (err) {
        if (isMounted) {
          setTokenStatus("invalid");
          setInvalidReason(
            err?.message || "This password reset link is invalid or has expired.",
          );
        }
      }
    };

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token, userStore]);

  // ⏱️ Auto-redirect countdown after successful reset
  useEffect(() => {
    if (!isSuccess || redirectTimer === 0) {
      if (isSuccess && redirectTimer === 0) {
        navigate("/login");
      }
      return;
    }
    const interval = setInterval(() => {
      setRedirectTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess, redirectTimer, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError({
      ...error,
      [name]: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newError = {};

    if (!formData.password.trim()) {
      newError.password = "New password is required";
    } else if (formData.password.length < 6) {
      newError.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword.trim()) {
      newError.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      newError.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newError).length > 0) {
      setError(newError);
      return;
    }

    setError({});

    try {
      const data = await userStore.resetPassword(token, formData.password);
      toast.success(data?.message || "Password reset successfully!");
      setIsSuccess(true);
      setRedirectTimer(3);
    } catch (err) {
      if (err?.field) {
        setError({ [err.field]: err.message });
      } else {
        toast.error(err?.message || "Failed to reset password");
      }
    }
  };

  return (
    <div className="auth-centered-page">
      <div className="auth-centered-card">
        {/* Logo */}
        <div className="auth-centered-logo">
          <div className="auth-mobile-logo-icon">U</div>
          <span>UserHub</span>
        </div>

        {/* ── 1. CHECKING TOKEN STATE ── */}
        {tokenStatus === "checking" && (
          <div className="auth-state-box">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  border: "3px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "btn-spin 0.8s linear infinite",
                }}
              />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "600", marginBottom: "8px" }}>
              Verifying reset link...
            </h3>
            <p className="auth-subtitle" style={{ marginBottom: 0 }}>
              Please wait while we validate your security link.
            </p>
          </div>
        )}

        {/* ── 2. INVALID OR EXPIRED TOKEN STATE ── */}
        {tokenStatus === "invalid" && (
          <div className="auth-state-box">
            <div className="auth-status-badge badge-danger">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 className="auth-state-title">Link expired or invalid</h2>
            <p className="auth-state-desc">
              {invalidReason ||
                "This password reset link is invalid, has expired, or has already been used."}
            </p>

            <div className="auth-state-tip">
              <svg
                width="15"
                height="15"
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
              <span>
                For your account security, password reset links expire after 15 minutes.
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => navigate("/forgotpassword")}
            >
              Request New Reset Link
            </button>

            <div className="auth-footer" style={{ marginTop: "18px" }}>
              <Link to="/login">← Back to sign in</Link>
            </div>
          </div>
        )}

        {/* ── 3. SUCCESS STATE (AFTER RESET) ── */}
        {tokenStatus === "valid" && isSuccess && (
          <div className="auth-state-box">
            <div className="auth-status-badge badge-emerald">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className="auth-state-title">Password reset successful!</h2>
            <p className="auth-state-desc">
              Your password has been updated. You can now sign in with your new credentials.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => navigate("/login")}
            >
              Proceed to Login
            </button>

            <p className="redirect-countdown">
              Redirecting to sign in in <strong>{redirectTimer}s</strong>...
            </p>

            <div className="auth-footer" style={{ marginTop: "14px" }}>
              <Link to="/login">← Back to sign in</Link>
            </div>
          </div>
        )}

        {/* ── 4. VALID TOKEN FORM (ENTER NEW PASSWORD) ── */}
        {tokenStatus === "valid" && !isSuccess && (
          <>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "4px" }}>
              Set new password
            </h2>
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
                placeholder="Minimum 6 characters"
                error={error.password}
                disabled={loading}
              />

              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                error={error.confirmPassword}
                disabled={loading}
              />

              <button
                type="submit"
                className="btn btn-primary btn-full reset-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner /> Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>

              <div className="auth-footer">
                <Link to="/login">← Back to sign in</Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default observer(ResetPassword);
