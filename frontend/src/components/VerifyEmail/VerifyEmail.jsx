/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
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
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timerId = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isSending) return;

    if (!token || !token.trim()) {
      toast.error("No verification token found. Please sign in or contact your administrator.");
      return;
    }

    setIsSending(true);
    try {
      const res = await userStore.resendVerificationEmail({ token: token.trim() });
      setCooldown(60);
      toast.success(res?.message || "Fresh verification link sent to your email!");
    } catch (err) {
      toast.error(err?.message || "Failed to send verification link");
    } finally {
      setIsSending(false);
    }
  };

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
            <h3 className="auth-state-title">Verifying Your Email...</h3>
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

            <h2 className="auth-state-title">Email Verified!</h2>
            <p className="auth-state-desc">
              {message ||
                "Your email address has been successfully verified. You can now sign in."}
            </p>

            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => navigate("/login")}
            >
              Proceed to Sign In
            </button>

            <p className="redirect-countdown">
              Redirecting to sign in in <strong>{redirectTimer}s</strong>...
            </p>

            <div className="auth-footer" style={{ marginTop: "14px" }}>
              <Link to="/login">← Back to Sign In</Link>
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

            <h2 className="auth-state-title">Verification Failed</h2>
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
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                Click below to receive a fresh 72-hour verification link sent directly to your registered email address.
              </span>
            </div>

            <div style={{ width: "100%", margin: "16px 0 12px 0" }}>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={handleResend}
                disabled={isSending || cooldown > 0}
                style={{
                  background: cooldown > 0 ? "rgba(99, 102, 241, 0.5)" : undefined,
                  cursor: cooldown > 0 ? "not-allowed" : "pointer",
                }}
              >
                {isSending
                  ? "Sending Fresh Link..."
                  : cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : "Resend Verification Link"}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => navigate("/login")}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Go to Sign In
            </button>

            <div className="auth-footer" style={{ marginTop: "14px" }}>
              Don&apos;t have an account? <Link to="/register">Sign Up</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default observer(VerifyEmail);
