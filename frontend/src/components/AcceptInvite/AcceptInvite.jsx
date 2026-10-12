import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUser,
  FiMail,
  FiShield,
  FiArrowRight,
} from "react-icons/fi";
import "./AcceptInvite.css";

function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { userStore } = useStore();
  const hasRequested = useRef(false);

  const [status, setStatus] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [inviteData, setInviteData] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [redirectTimer, setRedirectTimer] = useState(3);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    if (!token || !token.trim()) {
      setStatus("invalid");
      setErrorMessage("No invitation token provided.");
      return;
    }

    const verify = async () => {
      try {
        const data = await userStore.getInviteDetails(token.trim());
        setInviteData(data);
        setStatus("ready");
      } catch (err) {
        if (err?.status === 410 || err?.isExpired) {
          setStatus("expired");
          setErrorMessage(
            err?.message ||
              "This invitation link has expired (links are valid for 7 days).",
          );
        } else {
          setStatus("invalid");
          setErrorMessage(
            err?.message ||
              "This invitation link is invalid or has already been used.",
          );
        }
      }
    };

    verify();
  }, [token, userStore]);

  useEffect(() => {
    if (status !== "success") return;
    if (redirectTimer === 0) {
      navigate("/login");
      return;
    }

    const timer = setInterval(() => {
      setRedirectTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status, redirectTimer, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!password) {
      setFormError("Password is required");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      await userStore.acceptInvite(token.trim(), {
        password,
        confirmPassword,
      });

      setStatus("success");
      toast.success("Account activated successfully!");
    } catch (err) {
      setFormError(
        err?.message || "Failed to accept invitation. Please try again.",
      );
    }
  };

  return (
    <div className="accept-invite-page">
      <div className="accept-invite-card">
        <div className="accept-invite-brand">
          <div className="accept-invite-logo-icon">U</div>
          <span className="accept-invite-logo-text">UserHub</span>
        </div>

        {status === "verifying" && (
          <div className="ai-state-box">
            <div className="ai-spinner-wrap">
              <div className="ai-spinner" />
            </div>
            <h3 className="ai-state-title">Verifying Invitation Link...</h3>
            <p className="ai-state-desc">
              Please wait while we validate your secure account setup link.
            </p>
          </div>
        )}

        {status === "ready" && inviteData && (
          <div className="ai-form-container">
            <div className="ai-header-intro">
              <span className="ai-welcome-badge">Account Invitation</span>
              <h2 className="ai-main-title">Set Up Your Account</h2>
              <p className="ai-sub-title">
                You were invited to join UserHub by{" "}
                <strong>{inviteData.invitedByName}</strong>. Create your password to complete activation.
              </p>
            </div>

            <div className="ai-context-card">
              <div className="ai-context-row">
                <FiUser size={14} className="ai-context-icon" />
                <span className="ai-context-label">Account Name:</span>
                <span className="ai-context-value">{inviteData.name}</span>
              </div>
              <div className="ai-context-row">
                <FiMail size={14} className="ai-context-icon" />
                <span className="ai-context-label">Verified Email:</span>
                <span className="ai-context-value font-mono">
                  {inviteData.email}
                </span>
                <span className="ai-verified-tag">✓ Verified</span>
              </div>
            </div>

            {formError && (
              <div className="ai-alert-banner">
                <FiAlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="ai-form">
              <div className="ai-field-group">
                <label className="ai-label" htmlFor="password">
                  Create Password
                </label>
                <div className="ai-input-wrap">
                  <FiLock size={15} className="ai-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="ai-input"
                    value={password}
                    placeholder="Minimum 8 characters"
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={userStore.loading.acceptInvite}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="ai-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <div className="ai-field-group">
                <label className="ai-label" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="ai-input-wrap">
                  <FiLock size={15} className="ai-input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    className="ai-input"
                    value={confirmPassword}
                    placeholder="Re-enter your password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={userStore.loading.acceptInvite}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="ai-toggle-btn"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff size={15} />
                    ) : (
                      <FiEye size={15} />
                    )}
                  </button>
                </div>
              </div>

              <div className="ai-privacy-notice">
                <FiShield size={14} />
                <span>
                  Your password is end-to-end encrypted. Administrators cannot view your credentials.
                </span>
              </div>

              <button
                type="submit"
                className="ai-submit-btn"
                disabled={userStore.loading.acceptInvite}
              >
                {userStore.loading.acceptInvite ? (
                  "Activating Account..."
                ) : (
                  <>
                    <span>Activate Account & Sign In</span>
                    <FiArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {status === "expired" && (
          <div className="ai-state-box">
            <div className="ai-status-badge warning">
              <FiAlertCircle size={28} />
            </div>
            <h2 className="ai-state-title">Invitation Expired</h2>
            <p className="ai-state-desc">
              {errorMessage ||
                "This invitation link has expired. Invitation links remain active for 7 days."}
            </p>
            <div className="ai-guidance-box">
              <span>
                Please contact your administrator (the person who invited you) to send a fresh invitation to your email address.
              </span>
            </div>
            <Link to="/login" className="ai-btn-secondary">
              Go to Sign In
            </Link>
          </div>
        )}

        {status === "invalid" && (
          <div className="ai-state-box">
            <div className="ai-status-badge error">
              <FiAlertCircle size={28} />
            </div>
            <h2 className="ai-state-title">Invalid Invitation</h2>
            <p className="ai-state-desc">
              {errorMessage ||
                "This invitation link is invalid, malformed, or has already been accepted."}
            </p>
            <div className="ai-guidance-box">
              <span>
                If you have already created your password for this account, you can sign in directly with your email.
              </span>
            </div>
            <Link to="/login" className="ai-btn-primary">
              Proceed to Sign In
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="ai-state-box">
            <div className="ai-status-badge success">
              <FiCheckCircle size={32} />
            </div>
            <h2 className="ai-state-title">Account Activated! 🎉</h2>
            <p className="ai-state-desc">
              Your email has been verified and your secure password has been set. Welcome to UserHub!
            </p>
            <button
              type="button"
              className="ai-btn-primary"
              onClick={() => navigate("/login")}
            >
              Sign In to Your Account
            </button>
            <p className="ai-redirect-timer">
              Redirecting to sign in in <strong>{redirectTimer}s</strong>...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default observer(AcceptInvite);
