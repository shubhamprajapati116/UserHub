/* eslint-disable react-refresh/only-export-components */
import { Link } from "react-router-dom";
import "./forgotpassword.css";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import AuthBrandPanel from "../AuthBrandPanel/AuthBrandPanel";

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Forgotpassword() {
  const [error, seterror] = useState("");
  const [email, setemail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // 👈 Success screen toggle
  const [timer, setTimer] = useState(60); // 👈 60s Countdown
  const { userStore } = useStore();
  const loading = userStore.loading.forgotPassword;

  // ⏱️ 60s Countdown Timer Effect
  useEffect(() => {
    if (!isSubmitted || timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, timer]);

  // 1️⃣ Pehli baar Submit karne par
  const handlesubmit = async (e) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.trim() === "") {
      seterror("Email is required");
      return;
    }

    if (!emailPattern.test(email)) {
      seterror("Enter a valid email");
      return;
    }
    seterror("");

    try {
      const data = await userStore.forgotPassword(email);
      toast.success(data?.message || "Reset link sent!");
      setIsSubmitted(true); // 👈 Page ko Success State mein badal do
      setTimer(60); // 60s countdown shuru karo
    } catch (err) {
      if (err?.message?.includes("ENOTFOUND") || err?.message?.includes("connect")) {
        toast.error("Email service unreachable. Please check internet connection.");
        seterror("Email service unreachable. Please check your connection and try again.");
      } else {
        seterror(err?.message || "Failed to send reset link");
      }
    }
  };

  // 2️⃣ Dobara Link bhejne ke liye (Resend Handler)
  const handleResend = async () => {
    if (timer > 0 || loading) return;
    try {
      const data = await userStore.forgotPassword(email);
      toast.success(data?.message || "A new reset link has been sent!");
      setTimer(60); // Timer fir se 60s par reset
    } catch (err) {
      if (err?.message?.includes("ENOTFOUND") || err?.message?.includes("connect")) {
        toast.error("Email service unreachable. Please check internet connection.");
      } else {
        toast.error(err?.message || "Failed to resend reset link");
      }
    }
  };

  return (
    <div className="auth-split">
      <AuthBrandPanel
        title="Forgot your password?"
        subtitle="No worries — we'll send you a secure link to reset your password and get back into your account."
        type="forgot"
      />

      <div className="auth-split-form">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">U</div>
            <span>UserHub</span>
          </div>

          {!isSubmitted ? (
            // ── 🔹 STATE 1: Email Form ──
            <>
              <h2>Forgot password?</h2>
              <p className="auth-subtitle">
                No worries! Enter your email and we&apos;ll send you a reset link.
              </p>

              <form noValidate onSubmit={handlesubmit}>
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  className="form-input"
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  disabled={loading}
                  placeholder="you@example.com"
                  onChange={(e) => setemail(e.target.value)}
                />
                {error && <span className="form-error">{error}</span>}

                <button
                  className="btn btn-primary btn-full forgot-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <><Spinner /> Sending...</> : "Send reset link"}
                </button>

                <div className="auth-footer">
                  <Link to="/login">← Back to sign in</Link>
                </div>
              </form>
            </>
          ) : (
            // ── 🔹 STATE 2: Success Screen ("Check your email") ──
            <div className="auth-state-box">
              <div className="auth-status-badge badge-indigo">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
                  <polyline points="22,9 12,15 2,9" />
                </svg>
              </div>

              <h2 className="auth-state-title">Check your email</h2>
              <p className="auth-state-desc">
                We sent a password reset link to<br />
                <span className="auth-email-pill">{email}</span>
              </p>

              <div className="auth-state-tip">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Didn&apos;t receive it? Check your spam folder or resend.</span>
              </div>

              {/* Resend Button with Countdown */}
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={handleResend}
                disabled={loading || timer > 0}
              >
                {loading ? (
                  <><Spinner /> Sending...</>
                ) : timer > 0 ? (
                  `Resend link in ${timer}s`
                ) : (
                  "Resend reset link"
                )}
              </button>

              {/* Email change karne ka option */}
              <button
                type="button"
                className="btn-change-email"
                onClick={() => {
                  setIsSubmitted(false);
                  setTimer(60);
                }}
              >
                Use another email address
              </button>

              <div className="auth-footer" style={{ marginTop: "18px" }}>
                <Link to="/login">← Back to sign in</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default observer(Forgotpassword);