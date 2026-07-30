const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    password: String,

    gender: String,

    dob: Date,

    profilephoto: String,

    // New Fields
    phone: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // System Fields
    lastLogin: {
      type: Date,
      default: null,
    },

    resetPasswordToken: String,

    resetPasswordExpire: Date,

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,
  },
  {
    timestamps: true, // createdAt & updatedAt automatically generate honge
  }
);

module.exports = mongoose.model("User", UserSchema);