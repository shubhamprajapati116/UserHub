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
      country: "India",
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
        dob: editUser.dob ? (isNaN(new Date(editUser.dob).getTime()) ? "" : new Date(editUser.dob).toISOString().split("T")[0]) : "",
        phone: editUser.phone || "",
        bio: editUser.bio || "",
        country: "India",
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
      } else if (!error?.isNetworkError) {
        toast.error(error?.message || "User update failed");
      }
    }
  };

  return (
    <AppLayout
      title="Edit User"
      breadcrumbs={[
        { label: "Admin Panel", path: "/admin/users" },
        { label: "Users", path: "/admin/users" },
        { label: editUser?.name ? `Edit ${editUser.name}` : "Edit User" },
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
            onCancel={() => navigate("/admin/users")}
            loading={userStore.loading.updateUser}
            currentImage={editUser?.profilephoto}
            variant="admin"
          />
        </div>
      </div>
    </AppLayout>
  );
}

export default observer(EditUser);
