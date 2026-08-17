/* eslint-disable react-refresh/only-export-components */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./EditProfile.css";
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
      } else if (!error?.isNetworkError) {
        toast.error(error?.message || "Profile update failed");
      }
    }
  };

  return (
    <AppLayout
      title="Edit Profile"
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
    </AppLayout>
  );
}

export default observer(EditProfile);
