import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { observer } from "mobx-react-lite";
import AppLayout from "../AppLayout/AppLayout";
import AppDatePicker from "../AppDatePicker/AppDatePicker";
import CustomSelect from "../CustomSelect/CustomSelect";
import ImageCropperModal from "../ImageCropper/ImageCropperModal";
import { validateUserForm } from "../../utils/validateUserForm";
import useUserForm from "../../hooks/userUserform";
import { useStore } from "../../stores/StoreContext";
import {
  FiUser,
  FiMail,
  FiCamera,
  FiTrash2,
  FiShield,
  FiUserPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiSend,
  FiInfo,
  FiCornerDownRight,
  FiArrowRight,
} from "react-icons/fi";
import "./AddUser.css";

function Spinner({ size = 14 }) {
  return (
    <svg
      className="btn-spinner"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: size,
        height: size,
        animation: "aufSpin 0.8s linear infinite",
      }}
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

function AddUser() {
  const navigate = useNavigate();
  const { userStore } = useStore();
  const fileInputRef = useRef(null);

  const [cropperSrc, setCropperSrc] = useState("");
  const [showCropper, setShowCropper] = useState(false);

  const [emailCheck, setEmailCheck] = useState({
    status: "idle",
    message: "",
    suggestion: null,
  });

  const [inviteResult, setInviteResult] = useState(null);

  const { formData, setFormData, errors, setErrors, handleChange } =
    useUserForm({
      name: "",
      email: "",
      gender: "",
      dob: "",
      profilephoto: "",
    });

  const initials = useMemo(() => {
    return (formData.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [formData.name]);

  const photoPreviewUrl = useMemo(() => {
    if (formData.profilephoto instanceof File) {
      return URL.createObjectURL(formData.profilephoto);
    }
    return "";
  }, [formData.profilephoto]);

  useEffect(() => {
    const email = (formData.email || "").trim().toLowerCase();

    if (!email || !email.includes("@") || email.endsWith("@") || email.length < 5) {
      setEmailCheck({ status: "idle", message: "", suggestion: null });
      return;
    }

    const timer = setTimeout(async () => {
      setEmailCheck({ status: "checking", message: "Verifying domain & deliverability...", suggestion: null });
      try {
        const res = await userStore.validateInviteEmail(email);
        if (res?.valid) {
          setEmailCheck({
            status: "valid",
            message: "Domain verified: address can receive email",
            suggestion: res?.suggestion || null,
          });
        } else {
          setEmailCheck({
            status: "invalid",
            message: res?.reason || "Email cannot receive mail or is already registered",
            suggestion: res?.suggestion || null,
          });
        }
      } catch (_err) {
        setEmailCheck({
          status: "idle",
          message: "",
          suggestion: null,
        });
      }
    }, 550);

    return () => clearTimeout(timer);
  }, [formData.email, userStore]);

  const handleApplySuggestion = (suggestion) => {
    if (!suggestion) return;
    setFormData((prev) => ({ ...prev, email: suggestion }));
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = (croppedFile) => {
    setFormData((prev) => ({
      ...prev,
      profilephoto: croppedFile,
    }));
    if (errors.profilephoto) {
      setErrors((prev) => ({
        ...prev,
        profilephoto: "",
      }));
    }
    setShowCropper(false);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      profilephoto: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = validateUserForm(formData, {
      requirePassword: false,
      requireProfilePhoto: false,
      allowAnyEmail: true,
    });

    if (emailCheck.status === "invalid") {
      newErrors.email = emailCheck.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formDataObj.append(key, value);
        }
      });

      const res = await userStore.addUser(formDataObj);

      setInviteResult({
        name: formData.name,
        email: formData.email,
        deliveryStatus: res?.deliveryStatus || "sent",
        expiresAt: res?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        message: res?.message,
      });

      toast.success(res?.message || "Invitation sent successfully!");

      if (userStore.fetchUsers) {
        userStore.fetchUsers();
      }
    } catch (error) {
      if (error?.field) {
        setErrors({
          [error.field]: error.message,
        });
      } else if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to send invitation");
      }
    }
  };

  const handleResetForAnother = () => {
    setFormData({
      name: "",
      email: "",
      gender: "",
      dob: "",
      profilephoto: "",
    });
    setErrors({});
    setEmailCheck({ status: "idle", message: "", suggestion: null });
    setInviteResult(null);
  };

  return (
    <AppLayout
      title="Invite User"
      subtitle="Send a secure invitation link for account activation"
      breadcrumbs={[
        { label: "User Management", path: "/admin/users" },
        { label: "Invite User" },
      ]}
    >
      <div className="add-user-page-wrapper">
        {inviteResult ? (
          <div className="auf-card auf-result-card">
            <div className="auf-result-body">
              <div
                className={`auf-result-icon-badge ${
                  inviteResult.deliveryStatus === "failed" ? "warning" : "success"
                }`}
              >
                {inviteResult.deliveryStatus === "failed" ? (
                  <FiAlertCircle size={32} />
                ) : (
                  <FiCheckCircle size={32} />
                )}
              </div>

              <h2 className="auf-result-title">
                {inviteResult.deliveryStatus === "failed"
                  ? "User Created (Delivery Warning)"
                  : "Invitation Dispatched! 🎉"}
              </h2>

              <p className="auf-result-desc">
                {inviteResult.deliveryStatus === "failed"
                  ? `An account record for ${inviteResult.name} was created, but email delivery encountered an issue. You can retry dispatching the invitation from the user directory.`
                  : `A secure 7-day invitation link has been dispatched to ${inviteResult.email}. The account will remain pending until the user verifies their email and sets a password.`}
              </p>

              <div className="auf-result-summary-box">
                <div className="auf-summary-row">
                  <span className="auf-summary-label">Invited User</span>
                  <span className="auf-summary-value">{inviteResult.name}</span>
                </div>
                <div className="auf-summary-row">
                  <span className="auf-summary-label">Recipient Email</span>
                  <span className="auf-summary-value font-mono">
                    {inviteResult.email}
                  </span>
                </div>
                <div className="auf-summary-row">
                  <span className="auf-summary-label">Delivery Status</span>
                  <span
                    className={`auf-summary-pill ${
                      inviteResult.deliveryStatus === "failed"
                        ? "failed"
                        : "delivered"
                    }`}
                  >
                    {inviteResult.deliveryStatus === "failed"
                      ? "Delivery Failed"
                      : "Dispatched to Mailbox"}
                  </span>
                </div>
                <div className="auf-summary-row">
                  <span className="auf-summary-label">Invitation Expiry</span>
                  <span className="auf-summary-value">
                    {new Date(inviteResult.expiresAt).toLocaleDateString(
                      "en-IN",
                      { dateStyle: "medium" },
                    )}{" "}
                    (7 days)
                  </span>
                </div>
              </div>

              <div className="auf-result-actions">
                <button
                  type="button"
                  className="auf-btn-result-another"
                  onClick={handleResetForAnother}
                >
                  <FiUserPlus size={15} />
                  <span>Invite Another User</span>
                </button>

                <button
                  type="button"
                  className="auf-btn-result-directory"
                  onClick={() => navigate("/admin/users")}
                >
                  <span>View User Directory</span>
                  <FiArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="auf-card">
            <div className="auf-header">
              <div className="auf-header-left">
                <div className="auf-header-icon-box">
                  <FiUserPlus size={20} />
                </div>
                <div className="auf-header-text">
                  <h3>Invite New User</h3>
                  <p>
                    Provide user details to dispatch a secure 7-day account activation invitation.
                  </p>
                </div>
              </div>
              <span className="auf-header-badge">Verification Enforced</span>
            </div>

            <div className="auf-workflow-strip">
              <div className="auf-wf-step">
                <span className="auf-wf-num">1</span>
                <div className="auf-wf-meta">
                  <strong>Admin Invites</strong>
                  <span>Email verified for deliverability</span>
                </div>
              </div>
              <div className="auf-wf-divider" />
              <div className="auf-wf-step">
                <span className="auf-wf-num">2</span>
                <div className="auf-wf-meta">
                  <strong>User Receives Link</strong>
                  <span>Clicks 7-day private token</span>
                </div>
              </div>
              <div className="auf-wf-divider" />
              <div className="auf-wf-step">
                <span className="auf-wf-num">3</span>
                <div className="auf-wf-meta">
                  <strong>Sets Own Password</strong>
                  <span>Account activates automatically</span>
                </div>
              </div>
            </div>

            <div className="auf-body">
              <div className="auf-avatar-section">
                <div
                  className="auf-avatar-wrapper"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to select profile photo (Optional)"
                >
                  <div className="auf-avatar-ring">
                    {photoPreviewUrl ? (
                      <img
                        src={photoPreviewUrl}
                        alt={formData.name || "User Avatar"}
                        className="auf-avatar-img"
                      />
                    ) : (
                      <div className="auf-avatar-placeholder">
                        {initials ? (
                          <span className="auf-avatar-initials">{initials}</span>
                        ) : (
                          <FiCamera size={26} />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="auf-avatar-camera-badge" title="Upload Photo">
                    <FiCamera size={13} />
                  </div>
                </div>

                <div className="auf-avatar-details">
                  <div className="auf-avatar-label-row">
                    <h4 className="auf-avatar-title">
                      Profile Picture <span className="auf-opt">(Optional)</span>
                    </h4>
                    <span className="auf-avatar-meta-hint">
                      JPG, PNG, WebP (max 5MB)
                    </span>
                  </div>
                  <p className="auf-avatar-desc">
                    You can set an initial picture, or let the user upload their own upon activation.
                  </p>

                  <div className="auf-avatar-actions-row">
                    <button
                      type="button"
                      className="auf-btn-photo-upload"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={userStore.loading.addUser}
                    >
                      <FiCamera size={13} />
                      <span>
                        {formData.profilephoto ? "Change Photo" : "Upload Photo"}
                      </span>
                    </button>

                    {Boolean(formData.profilephoto) && (
                      <button
                        type="button"
                        className="auf-btn-photo-remove"
                        onClick={handleRemovePhoto}
                        title="Remove selected picture"
                        disabled={userStore.loading.addUser}
                      >
                        <FiTrash2 size={13} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  {errors.profilephoto && (
                    <span className="auf-error">{errors.profilephoto}</span>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    id="profilephoto"
                    name="profilephoto"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoSelect}
                    disabled={userStore.loading.addUser}
                  />
                </div>
              </div>

              <div className="auf-fields-grid">
                <div className="auf-field-group">
                  <label className="auf-label" htmlFor="name">
                    <span>
                      Full Name <span className="auf-req">*</span>
                    </span>
                  </label>
                  <div
                    className={`auf-input-wrap ${
                      errors.name ? "has-error" : ""
                    }`}
                  >
                    <span className="auf-input-icon">
                      <FiUser size={14} />
                    </span>
                    <input
                      className="auf-input"
                      type="text"
                      id="name"
                      name="name"
                      maxLength={50}
                      value={formData.name}
                      placeholder="e.g. Sarah Connor"
                      onChange={handleChange}
                      disabled={userStore.loading.addUser}
                    />
                  </div>
                  {errors.name && (
                    <span className="auf-error">{errors.name}</span>
                  )}
                </div>

                <div className="auf-field-group">
                  <label className="auf-label" htmlFor="email">
                    <span>
                      Email Address <span className="auf-req">*</span>
                    </span>
                    {emailCheck.status === "checking" && (
                      <span className="auf-email-live-status checking">
                        <Spinner size={11} />
                        <span>Checking domain...</span>
                      </span>
                    )}
                    {emailCheck.status === "valid" && (
                      <span className="auf-email-live-status valid">
                        <FiCheckCircle size={11} />
                        <span>Deliverable</span>
                      </span>
                    )}
                  </label>
                  <div
                    className={`auf-input-wrap ${
                      errors.email || emailCheck.status === "invalid"
                        ? "has-error"
                        : emailCheck.status === "valid"
                        ? "has-success"
                        : ""
                    }`}
                  >
                    <span className="auf-input-icon">
                      <FiMail size={14} />
                    </span>
                    <input
                      className="auf-input"
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      placeholder="e.g. sarah.connor@gmail.com"
                      onChange={handleChange}
                      disabled={userStore.loading.addUser}
                    />
                  </div>

                  {emailCheck.suggestion && (
                    <div className="auf-typo-suggestion-chip">
                      <FiCornerDownRight size={13} />
                      <span>
                        Did you mean{" "}
                        <strong>{emailCheck.suggestion}</strong>?
                      </span>
                      <button
                        type="button"
                        className="auf-btn-apply-typo"
                        onClick={() =>
                          handleApplySuggestion(emailCheck.suggestion)
                        }
                      >
                        Apply Fix
                      </button>
                    </div>
                  )}

                  {errors.email ? (
                    <span className="auf-error">{errors.email}</span>
                  ) : emailCheck.status === "invalid" ? (
                    <span className="auf-error">{emailCheck.message}</span>
                  ) : (
                    <span className="auf-hint">
                      Recipient will receive an activation link to set their own password
                    </span>
                  )}
                </div>

                <div className="auf-field-group">
                  <label className="auf-label" htmlFor="dob">
                    <span>
                      Date of Birth <span className="auf-req">*</span>
                    </span>
                  </label>
                  <div className="auf-picker-wrap">
                    <AppDatePicker
                      id="dob"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      disabled={userStore.loading.addUser}
                      maxDate={new Date()}
                      placeholderText="DD / MM / YYYY"
                      error={!!errors.dob}
                    />
                  </div>
                  {errors.dob && <span className="auf-error">{errors.dob}</span>}
                </div>

                <div className="auf-field-group">
                  <label className="auf-label" htmlFor="gender">
                    <span>
                      Gender <span className="auf-req">*</span>
                    </span>
                  </label>
                  <div className="auf-select-wrap">
                    <CustomSelect
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={userStore.loading.addUser}
                      placeholder="Select gender"
                      error={!!errors.gender}
                      options={[
                        { label: "Male", value: "male" },
                        { label: "Female", value: "female" },
                        { label: "Other", value: "other" },
                      ]}
                    />
                  </div>
                  {errors.gender && (
                    <span className="auf-error">{errors.gender}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="auf-footer">
              <div className="auf-footer-row">
                <div className="auf-footer-notice">
                  <FiInfo size={15} />
                  <span>
                    Account remains locked until recipient accepts the email link
                  </span>
                </div>

                <div className="auf-footer-actions">
                  <button
                    type="button"
                    className="auf-btn-cancel"
                    onClick={() => navigate("/admin/users")}
                    disabled={userStore.loading.addUser}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="auf-btn-submit"
                    disabled={
                      userStore.loading.addUser ||
                      emailCheck.status === "invalid" ||
                      emailCheck.status === "checking"
                    }
                  >
                    {userStore.loading.addUser ? (
                      <>
                        <Spinner /> Sending Invitation...
                      </>
                    ) : (
                      <>
                        <FiSend size={15} /> Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="auf-footer-security-banner">
                <FiShield size={16} className="auf-footer-security-icon" />
                <div className="auf-footer-security-text">
                  <strong>Zero-Knowledge Credentials</strong>
                  <p>
                    Administrators do not set user passwords. The user will choose a private password during invitation setup.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {showCropper && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropper(false)}
          loading={false}
        />
      )}
    </AppLayout>
  );
}

export default observer(AddUser);
