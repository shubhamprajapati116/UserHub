import React, { useState, useEffect, useRef } from "react";
import "./EmailOtpModal.css";

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

export default function EmailOtpModal({
  isOpen,
  newEmail,
  onVerify,
  onResend,
  onCancel,
  loading = false,
  resendLoading = false,
  error = "",
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [localError, setLocalError] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setTimer(60);
      setLocalError("");
      return;
    }

    setTimer(60);
    // Auto focus first input box on open
    const timeout = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 120);

    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  if (!isOpen) return null;

  const handleInputChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);
    setLocalError("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const updated = [...digits];
    pasted.split("").forEach((char, i) => {
      if (i < 6) updated[i] = char;
    });
    setDigits(updated);
    setLocalError("");

    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const otpCode = digits.join("");
    if (otpCode.length !== 6) {
      setLocalError("Please enter all 6 digits of the verification code.");
      return;
    }
    onVerify(otpCode);
  };

  const handleResendClick = async () => {
    if (timer > 0 || resendLoading) return;
    const success = await onResend();
    if (success !== false) {
      setTimer(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const displayError = localError || error;

  return (
    <div className="email-otp-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="email-otp-card" role="dialog" aria-modal="true" aria-labelledby="email-otp-title">
        <button
          type="button"
          className="email-otp-close-btn"
          onClick={onCancel}
          aria-label="Close"
          title="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="email-otp-header">
          <div className="email-otp-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h3 id="email-otp-title" className="email-otp-title">Verify New Email Address</h3>
          <p className="email-otp-desc">
            We sent a 6-digit verification code to <span className="email-otp-target">{newEmail}</span>. Enter the code below to confirm this email belongs to you.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="email-otp-boxes">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                className={`email-otp-box ${displayError ? "error" : ""}`}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                disabled={loading}
                aria-label={`Digit ${idx + 1}`}
              />
            ))}
          </div>

          {displayError && (
            <div className="email-otp-error-msg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{displayError}</span>
            </div>
          )}

          <div className="email-otp-resend-wrap">
            {timer > 0 ? (
              <span>Resend code in <strong>{timer}s</strong></span>
            ) : (
              <span>
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  className="email-otp-resend-btn"
                  onClick={handleResendClick}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Sending..." : "Resend Code"}
                </button>
              </span>
            )}
          </div>

          <div className="email-otp-actions">
            <button
              type="button"
              className="email-otp-btn-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="email-otp-btn-submit"
              disabled={loading || digits.join("").length !== 6}
            >
              {loading && <Spinner />}
              <span>{loading ? "Verifying..." : "Confirm & Save Email"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
