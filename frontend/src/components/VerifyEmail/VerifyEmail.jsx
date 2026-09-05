/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import "../ForgotPassword/forgotpassword.css";

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { userStore } = useStore();
  const hasRequested = useRef(false);

  // 'verifying' | 'success' | 'error'
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [redirectTimer, setRedirectTimer] = useState(3);

  // 1️⃣ Verify Token on mount
  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    if (!token || !token.trim()) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verify = async () => {
      try {
        const data = await userStore.verifyEmail(token.trim());
        setStatus("success");
        setMessage(data?.message || "Email verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage(
          err?.message || "Email verification link is invalid or has expired.",
        );
      }
    };

    verify();
  }, [token, userStore]);

  // 2️⃣ Auto-Redirect to login on Success
  useEffect(() => {
    if (status !== "success" || redirectTimer === 0) {
      if (status === "success" && redirectTimer === 0) {
        navigate("/login");
      }
      return;
    }

    const interval = setInterval(() => {
      setRedirectTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, redirectTimer, navigate]);

  return (
    <div className="auth-centered-page">
      <div className="auth-centered-card">
        {/* Logo */}
        <div className="auth-centered-logo">
          <div className="auth-mobile-logo-icon">U</div>
          <span>UserHub</span>
        </div>

        {/* ── 1. LOADING / VERIFYING STATE ── */}
        {status === "verifying" && (
          <div className="auth-state-box">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "14px",
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
            <h3 className="auth-state-title">Verifying your email...</h3>
            <p className="auth-state-desc" style={{ marginBottom: 0 }}>
              Please wait a moment while we validate your verification link.
            </p>
          </div>
        )}

        {/* ── 2. SUCCESS STATE ── */}
        {status === "success" && (
          <div className="auth-state-box">
            <div className="auth-status-badge badge-emerald">
              <svg
                width="24"
                height="24"
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

            <h2 className="auth-state-title">Email verified!</h2>
            <p className="auth-state-desc">
              {message ||
                "Your email address has been successfully verified. You can now sign in."}
            </p>

            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => navigate("/login")}
            >
              Proceed to Login
            </button>

            <p className="redirect-countdown">
              Redirecting to login in <strong>{redirectTimer}s</strong>...
            </p>

            <div className="auth-footer" style={{ marginTop: "14px" }}>
              <Link to="/login">← Back to sign in</Link>
            </div>
          </div>
        )}

        {/* ── 3. ERROR / EXPIRED STATE ── */}
        {status === "error" && (
          <div className="auth-state-box">
            <div className="auth-status-badge badge-danger">
              <svg
                width="24"
                height="24"
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

            <h2 className="auth-state-title">Verification failed</h2>
            <p className="auth-state-desc">
              {message ||
                "This email verification link is invalid, expired, or has already been used."}
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
                If you already verified or need a new account, please sign in
                or register again.
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => navigate("/login")}
            >
              Go to Sign In
            </button>

            <div className="auth-footer" style={{ marginTop: "14px" }}>
              Don&apos;t have an account? <Link to="/register">Sign up</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default observer(VerifyEmail);