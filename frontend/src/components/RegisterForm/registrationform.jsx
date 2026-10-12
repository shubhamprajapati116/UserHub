import { useState, useRef, useEffect } from "react";
import "../RegisterForm/registrationform.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { observer } from "mobx-react-lite";
import UserFormFields from "../UserFormField/UserFormfields";
import AuthBrandPanel from "../AuthBrandPanel/AuthBrandPanel";
import { validateUserForm } from "../../utils/validateUserForm";
import useUserForm from "../../hooks/userUserform";
import { useStore } from "../../stores/StoreContext";
import apirequest from "../../api/apirequest";
import {
  FiCheck,
  FiArrowLeft,
  FiArrowRight,
  FiUser,
} from "react-icons/fi";

const autoCropImage = (file, targetSize = 400) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const startX = (img.naturalWidth - minDim) / 2;
        const startY = (img.naturalHeight - minDim) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
          img,
          startX,
          startY,
          minDim,
          minDim,
          0,
          0,
          targetSize,
          targetSize
        );

        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Auto-crop failed"));
              return;
            }
            const croppedFile = new File([blob], file.name, { type: mimeType });
            resolve(croppedFile);
          },
          mimeType,
          0.92
        );
      };
      img.onerror = () => reject(new Error("Image failed to load"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
};

const formatDisplayName = (name) => {
  if (!name || typeof name !== "string") return "New User";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getInitialsBg = (name) => {
  const gradients = [
    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
  ];
  let hash = 0;
  const str = name || "User";
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Regiform() {
  const navigate = useNavigate();
  const { userStore } = useStore();
  const loading = userStore.loading.register;

  const [step, setStep] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const { formData, errors, setErrors, handleChange, resetForm } = useUserForm({
    name: "",
    email: "",
    password: "",
    gender: "",
    dob: "",
    profilephoto: "",
  });

  const isBusy = checkingEmail || submitting || loading;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateform = () => {
    const newErrors = validateUserForm(formData, {
      requirePassword: true,
      requireProfilePhoto: false,
    });
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  const handleStep1Submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isBusy) return;

    const { isValid, errors: validationErrors } = validateform();
    if (!isValid) {
      const firstKey = Object.keys(validationErrors)[0];
      const firstMsg = validationErrors[firstKey];
      toast.error(firstMsg || "Please correct the errors in the form");

      const element = document.getElementById(firstKey);
      if (element && typeof element.focus === "function") {
        element.focus();
      }
      return;
    }

    setCheckingEmail(true);
    try {
      const res = await apirequest("/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email.trim() }),
      });

      if (res?.available) {
        toast.dismiss();
        setStep(2);
      }
    } catch (err) {
      const errMsg =
        err?.message ||
        "Email is already registered. Please log in or use another email.";
      setErrors((prev) => ({
        ...prev,
        email: errMsg,
      }));
      toast.error(errMsg);
      const emailElement = document.getElementById("email");
      if (emailElement && typeof emailElement.focus === "function") {
        emailElement.focus();
      }
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, JPEG, WEBP)");
      return;
    }

    try {
      const croppedFile = await autoCropImage(file, 400);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedPhoto(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedFile));
    } catch (err) {
      console.error("Auto-crop error:", err);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedPhoto(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFinalSubmit = async (photoToUse) => {
    if (isBusy) return;

    setSubmitting(true);
    toast.dismiss();

    try {
      const formDataObj = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "profilephoto") return;
        formDataObj.append(
          key,
          typeof value === "string" ? value.trim() : value
        );
      });

      if (photoToUse) {
        formDataObj.append("profilephoto", photoToUse);
      }

      const data = await userStore.register(formDataObj);

      toast.dismiss();
      toast.success(
        data?.message ||
          "Registration successful. Please check your email to verify your account."
      );
      resetForm();
      setErrors({});
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedPhoto(null);
      setPreviewUrl(null);
      setTimeout(() => {
        navigate("/login");
      }, 700);
    } catch (error) {
      toast.dismiss();
      if (error?.field) {
        setErrors({
          [error.field]: error.message,
        });
        toast.error(error.message);
        setStep(1);
      } else {
        toast.error(error?.message || "Registration Failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const initials = getInitials(formData.name);
  const initialsBg = getInitialsBg(formData.name);

  return (
    <div className="auth-split register-split">
      <AuthBrandPanel
        title="Join UserHub today"
        subtitle="Create your account and start managing your profile securely."
        type="register"
      />

      <div className="auth-split-form register-form-side">
        <div className="register-container">
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">U</div>
            <span>UserHub</span>
          </div>

          {step === 1 ? (
            <>
              <div className="reg-stepper-header">
                <div className="reg-stepper-track">
                  <div className="reg-stepper-item active">
                    <span className="reg-stepper-circle">1</span>
                    <span className="reg-stepper-label">Details</span>
                  </div>
                  <div className="reg-stepper-line" />
                  <div className="reg-stepper-item">
                    <span className="reg-stepper-circle">2</span>
                    <span className="reg-stepper-label">Avatar</span>
                  </div>
                </div>
                <div className="register-title-block">
                  <h2>Create an Account</h2>
                  <p>Enter your details to register and get started</p>
                </div>
              </div>

              <UserFormFields
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                handleSubmit={handleStep1Submit}
                loading={isBusy}
                buttontext="Continue to Step 2"
                loadingtext={checkingEmail ? "Checking details..." : "Validating..."}
                showLoginLink={true}
              />
            </>
          ) : (
            <div className="reg-step2-container">
              <div className="reg-step2-top-bar">
                <button
                  type="button"
                  className="reg-top-nav-btn back"
                  onClick={() => setStep(1)}
                  disabled={isBusy}
                >
                  <FiArrowLeft />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  className="reg-top-nav-btn skip"
                  onClick={() => handleFinalSubmit(null)}
                  disabled={isBusy}
                  title="Skip photo upload and register with initials avatar"
                >
                  {submitting && !selectedPhoto ? (
                    <>
                      <Spinner />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Skip</span>
                      <FiArrowRight />
                    </>
                  )}
                </button>
              </div>

              <div className="reg-stepper-header centered">
                <div className="reg-stepper-track centered">
                  <button
                    type="button"
                    className="reg-stepper-item completed clickable"
                    onClick={() => !isBusy && setStep(1)}
                    disabled={isBusy}
                    title="Click to edit account details"
                  >
                    <span className="reg-stepper-circle">
                      <FiCheck />
                    </span>
                    <span className="reg-stepper-label">Details</span>
                  </button>
                  <div className="reg-stepper-line completed" />
                  <div className="reg-stepper-item active">
                    <span className="reg-stepper-circle">2</span>
                    <span className="reg-stepper-label">Avatar</span>
                  </div>
                </div>
                <div className="register-title-block centered">
                  <h2>Profile Picture</h2>
                  <p>Upload a custom photo or skip to keep your initials.</p>
                </div>
              </div>

              <div className="reg-avatar-card">
                <div className="reg-avatar-clean-wrapper">
                  <div className={`reg-avatar-ring ${previewUrl ? "has-photo" : ""}`}>
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={formData.name || "Preview"}
                        className="reg-avatar-img"
                      />
                    ) : (
                      <div
                        className="reg-avatar-initials"
                        style={{ background: initialsBg }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                <div className="reg-user-identity">
                  <h3 className="reg-user-name">
                    {formatDisplayName(formData.name)}
                  </h3>
                  <span className="reg-user-email">
                    {formData.email || "user@example.com"}
                  </span>
                  <div className="reg-avatar-badge-status">
                    {previewUrl ? (
                      <span className="reg-status-pill custom">
                        <FiCheck className="pill-icon" /> Custom Photo Selected
                      </span>
                    ) : (
                      <span className="reg-status-pill default">
                        <FiUser className="pill-icon" /> Auto-Generated Initials
                      </span>
                    )}
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  disabled={isBusy}
                />

                {previewUrl ? (
                  <div className="reg-photo-active-controls">
                    <button
                      type="button"
                      className="reg-btn-photo-action change"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isBusy}
                    >
                      <span>Change Photo</span>
                    </button>
                    <button
                      type="button"
                      className="reg-btn-photo-action remove"
                      onClick={handleRemovePhoto}
                      disabled={isBusy}
                    >
                      <span>Remove Photo</span>
                    </button>
                  </div>
                ) : (
                  <div className="reg-upload-prompt-card">
                    <button
                      type="button"
                      className="reg-btn-upload-trigger"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isBusy}
                    >
                      <span>Upload Custom Photo</span>
                    </button>
                    <p className="reg-upload-hint">JPG, PNG, WEBP (Max 5MB)</p>
                  </div>
                )}
              </div>

              {previewUrl && (
                <div className="reg-step2-bottom-action">
                  <button
                    type="button"
                    className="btn btn-primary reg-btn-complete-full"
                    onClick={() => handleFinalSubmit(selectedPhoto)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <>
                        <Spinner />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default observer(Regiform);
