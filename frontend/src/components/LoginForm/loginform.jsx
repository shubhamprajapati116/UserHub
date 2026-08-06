/* eslint-disable react-refresh/only-export-components */
import "./loginform.css";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import PasswordInput from "../PasswordInput/passwordinput";
import AuthBrandPanel from "../AuthBrandPanel/AuthBrandPanel";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";

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
      } else if (!error?.isNetworkError) {
        toast.error(error?.message || "Something went wrong");
      }
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
