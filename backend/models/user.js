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
    // ── Device-Based 2FA & OTP Fields ──
    trustedDevices: [
      {
        deviceId: {
          type: String,
          required: true,
        },
        userAgent: String,
        ip: String,
        trustedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    loginOtp: {
      type: String, // 6-digit OTP
      default: null,
    },
    loginOtpExpire: {
      type: Date, // OTP Expiry (e.g. 5 minutes)
      default: null,
    },
   lastOtpSentAt: {
      type: Date,
      default: null,
    },
    // ── Account Verification & Security Fields ──
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,

    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
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
    timestamps: true, 
  },
);

module.exports = mongoose.model("User", UserSchema);
