const joi = require("joi");

const userSchema = joi.object({
  name: joi.string().trim().min(3).max(50).required(),
  email: joi.string().trim().email().required(),
  password: joi.string().min(8).required(),
  dob: joi.date().required(),
  gender: joi.string().valid("male", "female", "other").required(),
  profilephoto: joi.any().allow("", null).optional(),
});
const loginschema = joi.object({
  email: joi.string().trim().email().required(),
  password: joi.string().required(),
  deviceId: joi.string().allow("").optional(),
});
const updateUserSchema = joi
  .object({
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
    profilephoto: joi.any().optional(),
    removePhoto: joi.any().optional(),
    profileBanner: joi.string().trim().allow("").optional(),
  })
  .unknown(true);

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

const inviteUserSchema = joi.object({
  name: joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 3 characters",
    "string.max": "Full name cannot exceed 50 characters",
  }),
  email: joi.string().trim().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please enter a valid email address",
  }),
  dob: joi.date().required().messages({
    "any.required": "Date of birth is required",
  }),
  gender: joi.string().valid("male", "female", "other").required().messages({
    "any.only": "Please select a valid gender",
    "any.required": "Gender is required",
  }),
  profilephoto: joi.any().allow("", null).optional(),
});

const acceptInviteSchema = joi
  .object({
    
    password: joi.string().min(8).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters",
      "any.required": "Password is required",
    }),
    confirmPassword: joi
      .string()
      .valid(joi.ref("password"))
      .optional()
      .messages({
        "any.only": "Passwords do not match",
      }),
  })
  .required();

module.exports = {
  userSchema,
  loginschema,
  updateUserSchema,
  changePasswordValidation,
  inviteUserSchema,
  acceptInviteSchema,
};
