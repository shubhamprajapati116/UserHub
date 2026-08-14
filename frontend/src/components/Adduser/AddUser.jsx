/* eslint-disable react-refresh/only-export-components */
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import UserFormFields from "../UserFormField/UserFormfields";
import { validateUserForm } from "../../utils/validateUserForm";
import "../RegisterForm/registrationform.css";
import useUserForm from "../../hooks/userUserform";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
function AddUser() {
  const navigate = useNavigate();
  const { userStore } = useStore();
  const { formData, errors, setErrors, handleChange } = useUserForm({
    name: "",
    email: "",
    password: "",
    gender: "",
    dob: "",
    profilephoto: "",
  });

  const validateForm = () => {
    const newErrors = validateUserForm(formData, {
      requirePassword: true,
      requireProfilePhoto: true,
    });

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
        formDataObj.append(key, value);
      });

      const data = await userStore.addUser(formDataObj);
      toast.success(data.message);

      navigate("/admin/users");
    } catch (error) {
      if (error?.field) {
        setErrors({
          [error.field]: error.message,
        });
      } else if (!error?.isNetworkError) {
        toast.error(error.message || "Failed to add user");
      }
    }
  };
  return (
    <AppLayout title="Add User" subtitle="Create a new user account">
      <div className="page-container-form">
        <div className="register-edit-card">
          <div className="register-edit-body">
            <div className="edit-user-form-header">
              <div className="edit-user-header-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="17" y1="11" x2="23" y2="11" />
                </svg>
              </div>

              <div className="edit-user-header-content">
                <h3>Add new user</h3>
                <p>Enter the user's information to create a new account.</p>
              </div>
            </div>

            <div className="edit-user-divider" />

            <UserFormFields
              formData={formData}
              errors={errors}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              loading={userStore.loading.addUser}
              buttontext="Add User"
              loadingtext="Adding..."
              showCancelButton={true}
              onCancel={() => navigate("/admin/users")}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
export default observer(AddUser);
