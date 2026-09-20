/* eslint-disable react-refresh/only-export-components */
import "./loginform.css";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import PasswordInput from "../PasswordInput/passwordinput";
import AuthBrandPanel from "../AuthBrandPanel/AuthBrandPanel";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";

// ── Small reusable spinner ──
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

function Loginform() {
  const { userStore } = useStore();
  const navigate = useNavigate();
  const [formdata, setformdata] = useState({ email: "", password: "" });
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [error, seterror] = useState({});
  const loading = userStore.loading.login;
  const resendotp = userStore.loading.resendLoginOtp;
  const [timer, setTimer] = useState(60);

  // ── Unverified Account States ──
  const [isUnverified, setIsUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [verificationResent, setVerificationResent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Cooldown timer for resending verification link
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handlechange = (e) => {
    const { name, value } = e.target;
    setformdata({ ...formdata, [name]: value });
    seterror({ ...error, [name]: "" });
    if (name === "email" && isUnverified) {
      setIsUnverified(false);
    }
  };

  // Step 1: Email + Password Submit
  const handlesubmit = async (e) => {
    e.preventDefault();

    const newerror = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (formdata.email.trim() === "") newerror.email = "Email is required";
    else if (!emailPattern.test(formdata.email))
      newerror.email = "Enter a valid Email";

    if (formdata.password.trim() === "")
      newerror.password = "Password is required";

    seterror(newerror);
    try {
      if (Object.keys(newerror).length === 0) {
        console.log("Submitting login form with data:", formdata);
        const data = await userStore.login(formdata);

        // 🛡️ Agar Unknown Device hai, OTP Screen dikhao
        if (data?.requireOtp) {
          setShowOtpScreen(true);
          toast.info(
            data.message || "Please enter the OTP sent to your email.",
          );
        } else {
          // Known Device -> Direct Success
          toast.success(data.message || "Logged in successfully!");
          const userRole =
            data?.user?.role || data?.role || userStore.currentUser?.role;
          if (userRole === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/profile");
          }
        }
      }
    } catch (err) {
      if (
        err?.isUnverified ||
        err?.message?.toLowerCase().includes("verify your email")
      ) {
        setIsUnverified(true);
        setUnverifiedEmail(err.email || formdata.email);
        seterror({
          email:
            err.message ||
            "Please verify your email address before logging in.",
        });
      } else if (err?.field) {
        seterror({ [err.field]: err.message });
        setIsUnverified(false);
      } else if (!err?.isNetworkError) {
        toast.error(err?.message || "Something went wrong");
        setIsUnverified(false);
      }
    }
  };

  // ── Public Resend Verification Link Handler ──
  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || formdata.email;
    if (!targetEmail || !targetEmail.trim()) {
      seterror({ email: "Enter your email above to receive a verification link" });
      return;
    }
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      const res = await userStore.resendVerificationEmail(targetEmail.trim());
      setVerificationResent(true);
      setResendCooldown(60);
      setIsUnverified(true);
      toast.success(
        res?.message || "A fresh verification link has been sent to your email!",
      );
    } catch (err) {
      toast.error(err?.message || "Failed to resend verification link");
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (!showOtpScreen || timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showOtpScreen, timer]);

  // OTP digit input handler with auto-focus
  const handleOtpInput = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1); // only single digit
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    seterror({ ...error, otp: "" });
    // move focus to next box
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5)
      otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newDigits = [...otpDigits];
    pasted.split("").forEach((ch, i) => {
      newDigits[i] = ch;
    });
    setOtpDigits(newDigits);
    const lastFilled = Math.min(pasted.length, 5);
    otpRefs.current[lastFilled]?.focus();
  };

  // Step 2: OTP Verification Submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      seterror({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    try {
      const data = await userStore.verifyLoginOtp(formdata.email, otp);
      toast.success(data.message || "Device verified successfully!");
      const userRole =
        data?.user?.role || data?.role || userStore.currentUser?.role;
      if (userRole === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      seterror({ otp: err?.message || "Invalid or expired OTP" });
      toast.error(err?.message || "OTP verification failed");
    }
  };

  // Step 3: Resend OTP Handler
  const handleResendOtp = async () => {
    if (timer > 0) return;
    try {
      await userStore.resendLoginOtp(formdata.email);
      toast.success("A new OTP has been sent to your email.");
      setOtpDigits(["", "", "", "", "", ""]);
      setTimer(60);
      seterror({});
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      toast.error(err?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="auth-split">
      <AuthBrandPanel
        title="Manage users with confidence"
        subtitle="A secure platform for user management, profile updates, and account settings — built for teams."
        type="login"
      />
      <div className="auth-split-form">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">U</div>
            <span>UserHub</span>
          </div>

          {!showOtpScreen ? (
            // ── Normal Email/Password Form ──
            <>
              <h2>Sign In</h2>
              <p className="auth-subtitle">
                Welcome back! Enter your credentials to access your account.
              </p>
              <form onSubmit={handlesubmit} noValidate>
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  id="email"
                  name="email"
                  disabled={loading}
                  value={formdata.email}
                  onChange={handlechange}
                />
                {error.email && (
                  <span className="form-error">{error.email}</span>
                )}

                <label className="form-label" htmlFor="password">
                  Password
                </label>

                <PasswordInput
                  id="password"
                  name="password"
                  value={formdata.password}
                  onChange={handlechange}
                  placeholder="••••••••"
                  error={error.password}
                  disabled={loading}
                />

                <div className="auth-link-row">
                  <Link to="/forgotpassword">Forgot password?</Link>
                </div>

                {isUnverified && (
                  <div className="login-unverified-callout">
                    <div className="luc-header">
                      <div className="luc-icon-box">
                        <svg
                          width="18"
                          height="18"
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
                      <div className="luc-text">
                        <h4 className="luc-title">Account Not Verified</h4>
                        <p className="luc-desc">
                          Your email address hasn&apos;t been verified yet. Check your inbox or click below to receive a new link.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-luc-resend"
                      onClick={handleResendVerification}
                      disabled={isResending || resendCooldown > 0}
                    >
                      {isResending ? (
                        <>
                          <Spinner /> Sending link...
                        </>
                      ) : resendCooldown > 0 ? (
                        `Resend available in ${resendCooldown}s`
                      ) : verificationResent ? (
                        "Resend Verification Link Again"
                      ) : (
                        "Resend Verification Link"
                      )}
                    </button>
                  </div>
                )}

                <button
                  className="btn btn-primary btn-full login-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner /> Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="auth-footer">
                  Don&apos;t have an account?
                  <Link to="/register">Sign Up</Link>
                </div>
              </form>
            </>
          ) : (
            // ── 🛡️ 2FA / OTP Verification Screen ──
            <>
              <h2>Device Verification</h2>
              <p className="auth-subtitle">
                A new device or sign-in attempt was detected. Enter the 6-digit verification code sent to{" "}
                <strong>{formdata.email}</strong>.
              </p>

              <form onSubmit={handleOtpSubmit} noValidate>
                <label className="form-label">Verification Code</label>

                <div className="otp-boxes">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      className="otp-box"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      disabled={loading}
                      autoFocus={i === 0}
                      onChange={(e) => handleOtpInput(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      onFocus={(e) => e.target.select()}
                    />
                  ))}
                </div>
                {error.otp && <span className="form-error">{error.otp}</span>}

                <button
                  className="btn btn-primary btn-full login-submit"
                  type="submit"
                  style={{ marginTop: "16px" }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner /> Verifying...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "16px",
                    fontSize: "0.8125rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendotp || timer > 0}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent)",
                      cursor: "pointer",
                      fontWeight: "600",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {resendotp ? (
                      <>
                        <Spinner /> Sending...
                      </>
                    ) : timer > 0 ? (
                      `Resend Code in ${timer}s`
                    ) : (
                      "Resend Code"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpScreen(false);
                      setOtpDigits(["", "", "", "", "", ""]);
                      seterror({});
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default observer(Loginform);
