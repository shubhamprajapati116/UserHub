/* eslint-disable react-refresh/only-export-components */
import "./loginform.css";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import PasswordInput from "../PasswordInput/passwordinput";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
function AuthBrandPanel() {
  return (
    <div className="auth-split-brand">
      <div className="auth-brand-content">
        <div className="auth-brand-logo">
          <div className="auth-brand-logo-icon">U</div>
          <span>UserHub</span>
        </div>
        <h1 className="auth-brand-headline">Manage users with confidence</h1>
        <p className="auth-brand-desc">
          A secure platform for user management, profile updates, and account
          settings — built for teams.
        </p>
      </div>
      <div className="auth-brand-features">
        <div className="auth-brand-feature">
          <span className="auth-brand-feature-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          Secure authentication & role-based access
        </div>
        <div className="auth-brand-feature">
          <span className="auth-brand-feature-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </span>
          Complete user profile management
        </div>
        <div className="auth-brand-feature">
          <span className="auth-brand-feature-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          Password reset & account security
        </div>
      </div>
    </div>
  );
}

function Loginform() {
  const { userStore } = useStore();
  const navigate = useNavigate();
  const [formdata, setformdata] = useState({ email: "", password: "" });
  const [error, seterror] = useState({});
  const loading = userStore.loading.login;

  const handlechange = (e) => {
    const { name, value } = e.target;
    setformdata({ ...formdata, [name]: value });
    seterror({ ...error, [name]: "" });
  };

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
        const data = await userStore.login(formdata);
        toast.success(data.message);
        navigate("/profile");
      }
    } catch (error) {
      if (error?.field) {
        seterror({ [error.field]: error.message });
      } else {
        toast.error(error?.message || "Something went wrong");
      }
    }
  };

  return (
    <div className="auth-split">
      <AuthBrandPanel />
      <div className="auth-split-form">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">U</div>
            <span>UserHub</span>
          </div>

          <h2>Sign in</h2>
          <p className="auth-subtitle">
            Welcome back! Please enter your details.
          </p>

          <form onSubmit={handlesubmit} noValidate>
            <label className="form-label" htmlFor="email">
              Email
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
            {error.email && <span className="form-error">{error.email}</span>}

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

            <button
              className="btn btn-primary btn-full login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="auth-footer">
              Don&apos;t have an account?
              <Link to="/register">Sign up</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default observer(Loginform);
