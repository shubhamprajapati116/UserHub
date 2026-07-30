// import { useState } from "react";
import "../RegisterForm/registrationform.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import UserFormFields from "../UserFormField/UserFormfields";
import { validateUserForm } from "../../utils/validateUserForm";
import useUserForm from "../../hooks/userUserform";
import { useStore } from "../../stores/StoreContext";

function Regiform() {
  const navigate = useNavigate();
  const { userStore } = useStore();
  const loading = userStore.loading.register;

  const { formData, errors, setErrors, handleChange, resetForm } = useUserForm({
    name: "",
    email: "",
    password: "",
    gender: "",
    dob: "",
    profilephoto: "",
  });

  const validateform = () => {
    const newErrors = validateUserForm(formData, {
      requirePassword: true,
      requireProfilePhoto: true,
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateform();
    if (!isValid) {
      return;
    }
    try {
      const formDataObj = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });

      const data = await userStore.register(formDataObj);

      toast.success(data.message);
      resetForm();
      setErrors({});
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      if (error?.field) {
        setErrors({
          [error.field]: error.message,
        });
      } else {
        toast.error(error?.message || "Registration Failed");
      }
    }
  };
  const pageTitle = "Create account";

  const pageSubtitle = "Fill in your details to get started";
  return (
    <div className="auth-split register-split">
      <div className="auth-split-brand">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <div className="auth-brand-logo-icon">U</div>
            <span>UserHub</span>
          </div>
          <h1 className="auth-brand-headline">Join UserHub today</h1>
          <p className="auth-brand-desc">
            Create your account and start managing your profile securely.
          </p>
        </div>
        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <span className="auth-brand-feature-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <p>Create your account in seconds</p>
          </div>

          <div className="auth-brand-feature">
            <span className="auth-brand-feature-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <p>Upload your profile photo securely</p>
          </div>

          <div className="auth-brand-feature">
            <span className="auth-brand-feature-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="4" rx="1" />
                <rect x="14" y="10" width="7" height="11" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <p>Access your dashboard anywhere</p>
          </div>
        </div>
      </div>

      <div className="auth-split-form register-form-side">
        <div className="register-container">
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">U</div>
            <span>UserHub</span>
          </div>
          <div className="register-header">
            <div className="register-title-block">
              <h2>{pageTitle}</h2>
              <p>{pageSubtitle}</p>
            </div>
          </div>
          <UserFormFields
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading}
            buttontext="Create Account"
            loadingtext="Creating..."
            showLoginLink={true}
          />
        </div>
      </div>
    </div>
  );
}

export default Regiform;
