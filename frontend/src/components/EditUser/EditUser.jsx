/* eslint-disable react-refresh/only-export-components */
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import "./EditUser.css";
import EditUserForm from "../EditUserForm/EditUserForm";
import { validateUserForm } from "../../utils/validateUserForm";
import useUserForm from "../../hooks/userUserform";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
function EditUser() {
  const { userStore } = useStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const editUser = userStore.editUser;

  const { formData, setFormData, errors, setErrors, handleChange } =
    useUserForm({
      name: "",
      email: "",
      gender: "",
      dob: "",
      phone: "",
      bio: "",
      country: "",
      state: "",
      city: "",
      profilephoto: "",
    });
  useEffect(() => {
    if (id) {
      userStore.fetchUserById(id);
    }
  }, [id, userStore]);
  useEffect(() => {
    if (editUser) {
      setFormData({
        name: editUser.name || "",
        email: editUser.email || "",
        gender: editUser.gender || "",
        dob: editUser.dob?.split("T")[0] || "",

        phone: editUser.phone || "",
        bio: editUser.bio || "",
        country: editUser.country || "",
        state: editUser.state || "",
        city: editUser.city || "",

        profilephoto: editUser.profilephoto || "",
      });
    }
  }, [editUser, setFormData]);
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
      const data = await userStore.updateUser(id, formDataObj);
      toast.success(data.message);
      navigate("/admin/users");
    } catch (error) {
      if (error?.field) {
        setErrors({
          [error.field]: error.message,
        });
      } else {
        toast.error(error?.message || "User update failed");
      }
    }
  };
  return (
    <AppLayout title="Edit User" subtitle="Update user information">
      <div className="page-container-form">
        <div className="card register-edit-card">
          <div className="register-edit-body">
            <div className="edit-user-form-header">
              <div className="edit-user-header-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>

              <div className="edit-user-header-content">
                <h3>Edit user information</h3>
                <p>Update the user's personal and profile information.</p>
              </div>
            </div>

            <div className="edit-user-divider" />
            <EditUserForm
              formData={formData}
              errors={errors}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              submitText="Save Changes"
              onCancel={() => navigate("/admin/users")}
              loading={userStore.loading.updateUser}
              currentImage={editUser?.profilephoto}
              variant="admin"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
export default observer(EditUser);
