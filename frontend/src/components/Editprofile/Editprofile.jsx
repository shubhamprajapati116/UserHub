import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./EditProfile.css";
import EditUserForm from "../EditUserForm/EditUserForm";
import EmailOtpModal from "../EmailOtpModal/EmailOtpModal";
import AppLayout from "../AppLayout/AppLayout";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import { validateUserForm } from "../../utils/validateUserForm";
import useUserForm from "../../hooks/userUserform";

function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userStore } = useStore();
  const currentuser = userStore.currentUser;
  const { formData, errors, setFormData, setErrors, handleChange } =
    useUserForm({
      name: "",
      email: "",
      gender: "",
      dob: "",
      phone: "",
      bio: "",
      country: "India",
      state: "",
      city: "",
      profilephoto: "",
    });

  useEffect(() => {
    if (currentuser) {
      setFormData({
        name: currentuser.name || "",
        email: currentuser.email || "",
        gender: currentuser.gender || "",
        dob: currentuser.dob ? (isNaN(new Date(currentuser.dob).getTime()) ? "" : new Date(currentuser.dob).toISOString().split("T")[0]) : "",
        phone: currentuser.phone || "",
        bio: currentuser.bio || "",
        country: "India",
        state: currentuser.state || "",
        city: currentuser.city || "",
        profilephoto: currentuser.profilephoto || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentuser]);

  // Deep-linking Auto-Focus Handler
  useEffect(() => {
    const focusField = location.state?.focusField;
    if (focusField) {
      // Clear navigation state so refresh/back button doesn't force focus again
      window.history.replaceState({}, document.title);

      const timer = setTimeout(() => {
        const el = document.getElementById(focusField);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
          el.classList.add("field-focus-pulse");
          setTimeout(() => {
            el.classList.remove("field-focus-pulse");
          }, 2500);
        }
      }, 180);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState("");
  const [otpModalError, setOtpModalError] = useState("");

  const validateForm = () => {
    const newErrors = validateUserForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    try {
      const formDataObj = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "profilephoto") return;
        formDataObj.append(key, value);
      });

      if (formData.profilephoto instanceof File) {
        formDataObj.append("profilephoto", formData.profilephoto);
      }
      const data = await userStore.updateProfile(formDataObj);

      if (data?.requireEmailOtp) {
        setPendingNewEmail(data.newEmail || formData.email);
        setShowEmailOtpModal(true);
        toast.info(data.message || "Please enter the OTP sent to your new email.");
      } else {
        toast.success(data.message || "Profile updated successfully!");
        navigate("/profile");
      }
    } catch (error) {
      if (error?.field) {
        setErrors({
          [error.field]: error.message,
        });
        toast.error(error.message);
      } else if (!error?.isNetworkError) {
        toast.error(error?.message || "Profile update failed");
      }
    }
  };

  const handleVerifyEmailOtp = async (otpCode) => {
    try {
      setOtpModalError("");
      const res = await userStore.verifyEmailChangeOtp(otpCode);
      toast.success(res.message || "Email updated successfully!");
      setShowEmailOtpModal(false);
      navigate("/profile");
    } catch (err) {
      setOtpModalError(err.message || "Invalid verification code.");
    }
  };

  const handleResendEmailOtp = async () => {
    try {
      setOtpModalError("");
      const res = await userStore.resendEmailChangeOtp();
      toast.info(res.message || "New code sent to your email.");
      return true;
    } catch (err) {
      setOtpModalError(err.message || "Failed to resend code.");
      return false;
    }
  };

  const handleCancelEmailOtp = () => {
    setShowEmailOtpModal(false);
    setOtpModalError("");
    if (currentuser) {
      setFormData((prev) => ({ ...prev, email: currentuser.email }));
    }
  };

  return (
    <AppLayout
      title="Edit Profile"
      subtitle="Update your personal details, profile picture & bio"
      breadcrumbs={[
        { label: "My Profile", path: "/profile" },
        { label: "Edit Profile" },
      ]}
    >
      <div className="split-page-wrapper">
        <div className="form-main-card">
          <EditUserForm
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            submitText="Save Changes"
            onCancel={() => navigate("/profile")}
            loading={userStore.loading.updateProfile}
            currentImage={currentuser?.profilephoto}
            variant="profile"
          />
        </div>
      </div>

      <EmailOtpModal
        isOpen={showEmailOtpModal}
        newEmail={pendingNewEmail}
        onVerify={handleVerifyEmailOtp}
        onResend={handleResendEmailOtp}
        onCancel={handleCancelEmailOtp}
        loading={userStore.loading.verifyEmailChangeOtp}
        resendLoading={userStore.loading.resendEmailChangeOtp}
        error={otpModalError}
      />
    </AppLayout>
  );
}

export default observer(EditProfile);
