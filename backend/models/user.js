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
    profileBanner: {
      type: String,
      default: "banner_5",
    },
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
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    statusReason: {
      type: String,
      default: "",
    },
    statusUpdatedAt: {
      type: Date,
      default: null,
    },

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
      type: String, 
      default: null,
    },
    loginOtpExpire: {
      type: Date, 
      default: null,
    },
    lastOtpSentAt: {
      type: Date,
      default: null,
    },
    
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    emailChangeOtp: {
      type: String,
      default: null,
    },
    emailChangeOtpExpire: {
      type: Date,
      default: null,
    },
    
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpire: Date, 
    lastVerificationSentAt: Date, 

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
