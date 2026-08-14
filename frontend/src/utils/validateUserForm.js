export const validateUserForm = (
  formData,
  { requirePassword = false, requireProfilePhoto = false } = {},
) => {
  const errors = {};

  if (formData.name.trim() === "") {
    errors.name = "Name is required";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  if (formData.email.trim() === "") {
    errors.email = "Email is required";
  } else if (!emailPattern.test(formData.email)) {
    errors.email = "Enter a valid email";
  } else if (!gmailPattern.test(formData.email)) {
    errors.email = "Enter a valid Gmail address";
  }
  if (!formData.gender) {
    errors.gender = "Please select gender";
  }
  if (!formData.dob) {
    errors.dob = "Date of Birth is required";
  }
  if (requirePassword && (!formData.password || formData.password.length < 8)) {
    errors.password = "Password must be at least 8 characters";
  }
  if (requireProfilePhoto && !formData.profilephoto) {
    errors.profilephoto = "Please upload profile photo";
  }
  if (formData.phone && !/^[6-9][0-9]{9}$/.test(formData.phone)) {
  errors.phone = "Please enter a valid 10-digit mobile number";
}
  return errors;
};
