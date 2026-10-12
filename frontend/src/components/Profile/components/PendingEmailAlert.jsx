import "./PendingEmailAlert.css";

function PendingEmailAlert({
  user,
  pendingEmailExpired,
  pendingEmailExpiryStr,
  onResend,
  onCancel,
  isResending,
  isCancelling,
}) {
  if (!user?.pendingEmail) return null;

  return (
    <div className="pending-email-banner">
      <div className="pending-email-banner-icon">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="pending-email-banner-body">
        <p className="pending-email-banner-title">
          Email Change Pending Verification
        </p>
        <p className="pending-email-banner-desc">
          A request was made to change your email to{" "}
          <strong>{user.pendingEmail}</strong>.{" "}
          {pendingEmailExpired
            ? "The verification link has expired."
            : pendingEmailExpiryStr
              ? `Link expires on ${pendingEmailExpiryStr}.`
              : "Please verify it using the link sent to that email."}{" "}
          Your current email <strong>{user.email}</strong> remains active until verified.
        </p>
      </div>

      <div className="pending-email-actions">
        <button
          type="button"
          className="pending-email-resend-btn"
          onClick={onResend}
          disabled={isResending}
        >
          {isResending
            ? "Sending…"
            : pendingEmailExpired
              ? "Send New Link"
              : "Resend Link"}
        </button>
        <button
          type="button"
          className="pending-email-cancel-btn"
          onClick={onCancel}
          disabled={isCancelling}
          title="Cancel this email change request"
        >
          {isCancelling ? "Cancelling…" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

export default PendingEmailAlert;
