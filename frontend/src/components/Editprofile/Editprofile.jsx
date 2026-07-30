/* eslint-disable react-refresh/only-export-components */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Editprofile.css";
import EditUserForm from "../EditUserForm/EditUserForm";
import AppLayout from "../AppLayout/AppLayout";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import { validateUserForm } from "../../utils/validateUserForm";
import useUserForm from "../../hooks/userUserform";

function EditProfile() {
  const navigate = useNavigate();
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
      country: "",
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
        dob: currentuser.dob?.split("T")[0] || "",

        phone: currentuser.phone || "",
        bio: currentuser.bio || "",
        country: currentuser.country || "",
        state: currentuser.state || "",
        city: currentuser.city || "",

        profilephoto: currentuser.profilephoto || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentuser]);

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
      toast.success(data.message);

      navigate("/profile");
    } catch (error) {
      if (error?.field) {
        setErrors({
          [error.field]: error.message,
        });
      } else {
        toast.error(error?.message || "Profile update failed");
      }
    }
  };
  return (
    <AppLayout title="Edit Profile" subtitle="Update your personal information">
      <div className="page-container-form">
        <div className="card register-edit-card">
          <div className="register-edit-body">
            <div className="edit-profile-form-header">
              <div className="edit-profile-header-icon">
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

              <div className="edit-profile-header-content">
                <h3>Edit profile</h3>
                <p>Manage your personal information and account details.</p>
              </div>
            </div>

            <div className="edit-profile-divider" />

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
      </div>
    </AppLayout>
  );
}

export default observer(EditProfile);
