import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import { toast } from "react-toastify";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiArrowRight,
  FiRefreshCw,
} from "react-icons/fi";
import "./SecurityEmailModal.css";

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

function SecurityEmailModal({ isOpen, onClose }) {
  const { userStore } = useStore();
  const currentUser = userStore.currentUser;

  // Step 1: "form" (Enter new email + password) | Step 2: "otp" (Verify 6-digit code)
  const [step, setStep] = useState("form");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [formErrors, setFormErrors] = useState({});
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef([]);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setNewEmail("");
      setPassword("");
      setShowPassword(false);
      setOtp(["", "", "", "", "", ""]);
      setFormErrors({});
      setOtpError("");
      setCountdown(60);
      setCanResend(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Countdown timer for resend OTP in Step 2
  useEffect(() => {
    let timer;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  // Validate Step 1 Form
  const validateStep1 = () => {
    const errors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newEmail.trim()) {
      errors.newEmail = "New email address is required";
    } else if (!emailPattern.test(newEmail.trim())) {
      errors.newEmail = "Enter a valid email address";
    } else if (
      currentUser?.email &&
      newEmail.trim().toLowerCase() === currentUser.email.toLowerCase()
    ) {
      errors.newEmail = "New email must be different from your current email";
    }

    if (!password) {
      errors.password = "Current password is required to verify your identity";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Step 1: Request email change
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    try {
      setFormErrors({});
      const res = await userStore.requestEmailChange({
        newEmail: newEmail.trim().toLowerCase(),
        password,
      });

      toast.info(
        res?.message || `Verification code sent to ${newEmail.trim().toLowerCase()}`
      );
      setStep("otp");
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");

      // Focus first OTP input after switching step
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err) {
      if (err?.field) {
        setFormErrors({ [err.field]: err.message });
      } else {
        toast.error(err?.message || "Failed to request email change.");
      }
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError("");

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle OTP Paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setOtp(digits);
    setOtpError("");
    otpInputsRef.current[5]?.focus();
  };

  // Submit Step 2: Verify OTP
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setOtpError("");
      const res = await userStore.verifyEmailChangeOtp(otpCode);
      toast.success(res?.message || "Email updated successfully!");
      onClose();
    } catch (err) {
      setOtpError(err?.message || "Invalid or expired verification code.");
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend || userStore.loading.resendEmailChangeOtp) return;
    try {
      setOtpError("");
      const res = await userStore.resendEmailChangeOtp();
      toast.info(res?.message || "New verification code sent!");
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      setOtpError(err?.message || "Failed to resend code.");
    }
  };

  // Cancel Email Change
  const handleCancelAll = async () => {
    if (step === "otp") {
      try {
        await userStore.cancelEmailChange();
        toast.info("Email change request cancelled. Your email remains unchanged.");
      } catch {
        // Non-blocking
      }
    }
    onClose();
  };

  return (
    <div className="sem-overlay" onClick={handleCancelAll}>
      <div className="sem-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="sem-header">
          <div className="sem-header-left">
            <div className="sem-icon-circle">
              {step === "form" ? <FiLock size={18} /> : <FiMail size={18} />}
            </div>
            <div>
              <h3 className="sem-title">
                {step === "form" ? "Change Email Address" : "Verify New Email"}
              </h3>
              <p className="sem-subtitle">
                {step === "form"
                  ? "Enter your new email address and current password to continue"
                  : `Enter the 6-digit code sent to ${newEmail}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="sem-close-btn"
            onClick={handleCancelAll}
            aria-label="Close modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="sem-body">
          {step === "form" ? (
            <form onSubmit={handleRequestSubmit} noValidate>
              {/* Current Email Box */}
              <div className="sem-current-email-box">
                <div className="sem-current-label-row">
                  <span className="sem-box-label">Current Email</span>
                  <span className="sem-verified-pill">
                    <FiCheckCircle size={11} /> Primary & Verified
                  </span>
                </div>
                <div className="sem-current-value">
                  {currentUser?.email || "No email set"}
                </div>
              </div>

              {/* New Email Input */}
              <div className="sem-field-group">
                <label className="sem-label" htmlFor="sem-new-email">
                  New Email Address <span className="sem-required">*</span>
                </label>
                <div
                  className={`sem-input-wrap ${
                    formErrors.newEmail ? "has-error" : ""
                  }`}
                >
                  <span className="sem-input-icon">
                    <FiMail size={14} />
                  </span>
                  <input
                    id="sem-new-email"
                    type="email"
                    className="sem-input"
                    placeholder="Enter your new email address"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      if (formErrors.newEmail) {
                        setFormErrors((prev) => ({ ...prev, newEmail: null }));
                      }
                    }}
                    autoFocus
                    disabled={userStore.loading.requestEmailChange}
                  />
                </div>
                {formErrors.newEmail && (
                  <span className="sem-error-text">
                    <FiAlertCircle size={12} /> {formErrors.newEmail}
                  </span>
                )}
              </div>

              {/* Current Password Input */}
              <div className="sem-field-group">
                <label className="sem-label" htmlFor="sem-password">
                  Current Password <span className="sem-required">*</span>
                </label>
                <div
                  className={`sem-input-wrap ${
                    formErrors.password ? "has-error" : ""
                  }`}
                >
                  <span className="sem-input-icon">
                    <FiLock size={14} />
                  </span>
                  <input
                    id="sem-password"
                    type={showPassword ? "text" : "password"}
                    className="sem-input"
                    placeholder="Enter your current password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formErrors.password) {
                        setFormErrors((prev) => ({ ...prev, password: null }));
                      }
                    }}
                    disabled={userStore.loading.requestEmailChange}
                  />
                  <button
                    type="button"
                    className="sem-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
                {formErrors.password && (
                  <span className="sem-error-text">
                    <FiAlertCircle size={12} /> {formErrors.password}
                  </span>
                )}
              </div>

              {/* Security Banner */}
              <div className="sem-security-notice">
                <div className="sem-sec-icon">
                  <FiShield size={16} />
                </div>
                <div className="sem-sec-text">
                  <strong>Zero-Lockout Protection:</strong> Your current email will
                  remain fully active until the new email is verified with the OTP code.
                </div>
              </div>

              {/* Modal Actions */}
              <div className="sem-actions">
                <button
                  type="button"
                  className="sem-btn-cancel"
                  onClick={handleCancelAll}
                  disabled={userStore.loading.requestEmailChange}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sem-btn-primary"
                  disabled={userStore.loading.requestEmailChange}
                >
                  {userStore.loading.requestEmailChange ? (
                    <>
                      <Spinner /> Sending Code...
                    </>
                  ) : (
                    <>
                      Send Verification Code <FiArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} noValidate>
              {/* Step 2: OTP Verification */}
              <div className="sem-otp-instruction">
                We sent a 6-digit verification code to{" "}
                <strong className="sem-highlight">{newEmail}</strong>. Please enter the
                code below to confirm the change.
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="sem-otp-boxes-wrapper" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className={`sem-otp-box ${digit ? "filled" : ""} ${
                      otpError ? "has-error" : ""
                    }`}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={userStore.loading.verifyEmailChangeOtp}
                  />
                ))}
              </div>

              {otpError && (
                <div className="sem-otp-error">
                  <FiAlertCircle size={13} />
                  <span>{otpError}</span>
                </div>
              )}

              {/* Resend Action & Timer */}
              <div className="sem-resend-row">
                <span className="sem-resend-prompt">Didn't receive the email?</span>
                {canResend ? (
                  <button
                    type="button"
                    className="sem-resend-btn"
                    onClick={handleResend}
                    disabled={userStore.loading.resendEmailChangeOtp}
                  >
                    {userStore.loading.resendEmailChangeOtp ? (
                      <Spinner />
                    ) : (
                      <FiRefreshCw size={12} />
                    )}
                    Resend Code
                  </button>
                ) : (
                  <span className="sem-timer-text">
                    Resend available in{" "}
                    <strong>
                      00:{countdown < 10 ? `0${countdown}` : countdown}
                    </strong>
                  </span>
                )}
              </div>

              {/* Step 2 Actions */}
              <div className="sem-actions">
                <button
                  type="button"
                  className="sem-btn-cancel"
                  onClick={handleCancelAll}
                  disabled={userStore.loading.verifyEmailChangeOtp}
                >
                  Cancel & Keep Current
                </button>
                <button
                  type="submit"
                  className="sem-btn-primary"
                  disabled={
                    userStore.loading.verifyEmailChangeOtp ||
                    otp.join("").length !== 6
                  }
                >
                  {userStore.loading.verifyEmailChangeOtp ? (
                    <>
                      <Spinner /> Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Update Email <FiCheckCircle size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default observer(SecurityEmailModal);
