/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import "./EditUser.css";
import EditUserForm from "../EditUserForm/EditUserForm";
import AdminEmailConfirmModal from "../AdminEmailConfirmModal/AdminEmailConfirmModal";
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
        dob: editUser.dob
          ? isNaN(new Date(editUser.dob).getTime())
            ? ""
            : new Date(editUser.dob).toISOString().split("T")[0]
          : "",
        phone: editUser.phone || "",
        bio: editUser.bio || "",
        country: "India",
        state: editUser.state || "",
        city: editUser.city || "",
        profilephoto: editUser.profilephoto || "",
      });
    }
  }, [editUser, setFormData]);

  const getLastEditedText = () => {
    if (!editUser?.updatedAt) return null;
    const updated = new Date(editUser.updatedAt);
    if (isNaN(updated.getTime())) return null;

    const now = new Date();
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let relativeStr = "";
    if (diffMins < 2) relativeStr = "Just now";
    else if (diffMins < 60) relativeStr = `${diffMins} minutes ago`;
    else if (diffHours < 24)
      relativeStr = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    else if (diffDays === 1) relativeStr = "Yesterday";
    else if (diffDays < 30) relativeStr = `${diffDays} days ago`;
    else
      relativeStr = updated.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    return `Last edited by Admin · ${relativeStr}`;
  };

  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);

  const validateForm = () => {
    const newErrors = validateUserForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const performSubmit = async () => {
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
      setShowEmailConfirmModal(false);

      if (data.isEmailChanging) {
        // Email change is pending verification — show info toast
        toast.info(data.message, { autoClose: 8000 });
      } else {
        toast.success(data.message);
      }
      navigate("/admin/users");
    } catch (error) {
      setShowEmailConfirmModal(false);
      if (error?.field) {
        setErrors({
          [error.field]: error.message,
        });
        toast.error(error.message);
      } else if (!error?.isNetworkError) {
        toast.error(error?.message || "User update failed");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    const isEmailChanging =
      formData.email?.toLowerCase().trim() !==
      (editUser?.email || "").toLowerCase().trim();

    if (isEmailChanging) {
      setShowEmailConfirmModal(true);
      return;
    }

    await performSubmit();
  };

  const lastEditedText = getLastEditedText();

  return (
    <AppLayout
      title="Edit User"
      subtitle="Update user details, permissions & account profile"
      breadcrumbs={[
        { label: "Admin Panel", path: "/admin/users" },
        { label: editUser?.name ? `Edit ${editUser.name}` : "Edit User" },
      ]}
    >
      <div className="split-page-wrapper">
        {lastEditedText && (
          <div className="admin-edit-audit-banner">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{lastEditedText}</span>
          </div>
        )}

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

      <AdminEmailConfirmModal
        isOpen={showEmailConfirmModal}
        userName={editUser?.name}
        oldEmail={editUser?.email}
        newEmail={formData.email}
        onConfirm={performSubmit}
        onCancel={() => setShowEmailConfirmModal(false)}
        loading={userStore.loading.updateUser}
      />
    </AppLayout>
  );
}

export default observer(EditUser);
