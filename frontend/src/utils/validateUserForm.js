export const validateUserForm = (
  formData,
  {
    requirePassword = false,
    requireProfilePhoto = false,
    allowAnyEmail = false,
  } = {},
) => {
  const errors = {};

  const trimmedName = (formData.name || "").trim();
  if (!trimmedName) {
    errors.name = "Name is required";
  } else if (trimmedName.length < 3) {
    errors.name = "Name must be at least 3 characters";
  } else if (trimmedName.length > 50) {
    errors.name = "Name cannot exceed 50 characters";
  }

  const trimmedEmail = (formData.email || "").trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  if (!trimmedEmail) {
    errors.email = "Email is required";
  } else if (!emailPattern.test(trimmedEmail)) {
    errors.email = "Enter a valid email address";
  } else if (!allowAnyEmail && !gmailPattern.test(trimmedEmail)) {
    errors.email = "Enter a valid Gmail address";
  }

  if (!formData.gender || !["male", "female", "other"].includes(formData.gender)) {
    errors.gender = "Please select gender";
  }

  if (!formData.dob) {
    errors.dob = "Date of Birth is required";
  } else {
    const birthDate = new Date(formData.dob);
    if (isNaN(birthDate.getTime())) {
      errors.dob = "Enter a valid Date of Birth";
    } else if (birthDate > new Date()) {
      errors.dob = "Date of Birth cannot be in the future";
    }
  }

  if (requirePassword) {
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
  }

  if (requireProfilePhoto && !formData.profilephoto) {
    errors.profilephoto = "Please upload profile photo";
  }

  if (formData.phone && !/^[6-9][0-9]{9}$/.test(formData.phone)) {
    errors.phone = "Please enter a valid 10-digit mobile number";
  }

  return errors;
};
