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
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "India",
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

    notificationPreferences: {
      securityLoginAlerts: {
        type: Boolean,
        default: true,
      },
    },

    lastDeviceInfo: {
      userAgent: {
        type: String,
        default: "",
      },
      ip: {
        type: String,
        default: "",
      },
      lastLoginAt: {
        type: Date,
      },
    },

    resetPasswordToken: String,

    resetPasswordExpire: Date,

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,

    experience: [
      {
        title: { type: String, required: true },
        company: { type: String, required: true },
        employmentType: { type: String, default: "Full-time" },
        location: { type: String, default: "" },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
        description: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true, // createdAt & updatedAt automatically generate honge
  },
);

module.exports = mongoose.model("User", UserSchema);
