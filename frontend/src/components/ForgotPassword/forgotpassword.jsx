/* eslint-disable react-refresh/only-export-components */
import { Link } from "react-router-dom";
import "./forgotpassword.css";
import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import AuthBrandPanel from "../AuthBrandPanel/AuthBrandPanel";

function Forgotpassword() {
  const [error, seterror] = useState("");
  const [email, setemail] = useState("");
  const navigate = useNavigate();
  const { userStore } = useStore();
  const loading = userStore.loading.forgotPassword;
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
      toast.success(data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      seterror(error?.message || "Failed to send reset link");
    }
  };

  return (
    <div className="auth-split">
      <AuthBrandPanel
        title="Forgot your password?"
        subtitle="No worries — we'll send you a secure link to reset your password and get back into your account."
        type="login"
      />

      <div className="auth-split-form">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">U</div>
            <span>UserHub</span>
          </div>

          <h2>Reset password</h2>
          <p className="auth-subtitle">
            Enter your email and we&apos;ll send you a reset link.
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
              {loading ? "sending" : " Send reset link"}
            </button>

            <div className="auth-footer">
              <Link to="/login">← Back to sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default observer(Forgotpassword);
