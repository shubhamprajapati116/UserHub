const joi = require("joi");

const userSchema = joi.object({
  name: joi.string().trim().min(3).max(50).required(),
  email: joi.string().trim().email().required(),
  password: joi.string().min(8).required(),
  dob: joi.date().required(),
  gender: joi.string().valid("male", "female", "other").required(),
});
const loginschema = joi.object({
  email: joi.string().trim().email().required(),
  password: joi.string().required(),
  deviceId: joi.string().allow("").optional(),
});
const updateUserSchema = joi.object({
  name: joi.string().trim().min(3).max(50).required(),
  email: joi.string().trim().email().required(),
  dob: joi.date().required(),
  gender: joi.string().valid("male", "female", "other").required(),
  phone: joi
    .string()
    .trim()
    .pattern(/^[6-9][0-9]{9}$/)
    .allow("")
    .optional()
    .messages({
      "string.pattern.base": "Please enter a valid 10-digit mobile number",
    }),
  bio: joi.string().trim().max(500).allow("").optional(),
  country: joi.string().trim().max(100).allow("").optional(),
  state: joi.string().trim().max(100).allow("").optional(),
  city: joi.string().trim().max(100).allow("").optional(),
  role: joi.string().valid("admin", "user").optional(),
  profilephoto: joi.any().optional(),
});

const changePasswordValidation = (data) => {
  const changepasswordschema = joi.object({
    currentPassword: joi.string().required().messages({
      "string.empty": "Current password is required",
      "any.required": "Current password is required",
    }),
    newPassword: joi.string().min(8).required().messages({
      "string.empty": "New password is required",
      "string.min": "Password must be at least 8 characters",
      "any.required": "New password is required",
    }),
  });

  return changepasswordschema.validate(data);
};

module.exports = {
  userSchema,
  loginschema,
  updateUserSchema,
  changePasswordValidation,
};
