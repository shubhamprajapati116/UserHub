import "../RegisterForm/registrationform.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import UserFormFields from "../UserFormField/UserFormfields";
import AuthBrandPanel from "../AuthBrandPanel/AuthBrandPanel";
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
