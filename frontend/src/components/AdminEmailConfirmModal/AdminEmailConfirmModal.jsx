import React from "react";
import "./AdminEmailConfirmModal.css";

function Spinner() {
  return (
    <svg
      className="btn-spinner"
      viewBox="0 0 24 24"
      fill="none"
      width="18"
      height="18"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: "spin 0.8s linear infinite" }}
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

export default function AdminEmailConfirmModal({
  isOpen,
  userName,
  oldEmail,
  newEmail,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="admin-email-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="admin-email-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-email-modal-title"
      >
        <button
          type="button"
          className="admin-email-modal-close"
          onClick={onCancel}
          aria-label="Close"
          title="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="admin-email-modal-header">
          <div className="admin-email-warning-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 id="admin-email-modal-title" className="admin-email-modal-title">
              Confirm Email Change
            </h3>
            <p className="admin-email-modal-subtitle">
              You are modifying the email address for <strong>{userName || "this user"}</strong>.
            </p>
          </div>
        </div>

        <div className="admin-email-diff-box">
          <div className="admin-email-diff-row">
            <span className="admin-email-diff-label">Current Email:</span>
            <span className="admin-email-diff-val old">{oldEmail || "None"}</span>
          </div>
          <div className="admin-email-diff-row">
            <span className="admin-email-diff-label">New Email:</span>
            <span className="admin-email-diff-val new">{newEmail}</span>
          </div>
        </div>

        <div className="admin-email-notice-list">
          <div className="admin-email-notice-item">
            <span className="admin-email-notice-bullet">✉️</span>
            <span>
              A confirmation link will be dispatched to <strong>{newEmail}</strong>.
            </span>
          </div>
          <div className="admin-email-notice-item">
            <span className="admin-email-notice-bullet">🔒</span>
            <span>
              <strong>Zero Lockout Risk:</strong> Current email (<strong>{oldEmail}</strong>) remains fully active and working until the user confirms the new address.
            </span>
          </div>
          <div className="admin-email-notice-item">
            <span className="admin-email-notice-bullet">🛡️</span>
            <span>
              Once the user confirms the link in their new inbox, the account email will automatically be swapped and activated.
            </span>
          </div>
        </div>

        <div className="admin-email-modal-actions">
          <button
            type="button"
            className="admin-email-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel & Review
          </button>
          <button
            type="button"
            className="admin-email-btn-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Spinner />}
            <span>{loading ? "Updating & Sending Link..." : "Confirm & Send Link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
