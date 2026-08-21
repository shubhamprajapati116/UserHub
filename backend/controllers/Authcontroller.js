const crypto = require("crypto");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const { userSchema, loginschema } = require("../validations/validate");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { v4: uuidv4 } = require("uuid");
const Session = require("../models/session");
const getDeviceInfo = require("../utils/getDeviceInfo");

const registeruser = async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        field: error.details[0].path[0],
        message: error.details[0].message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        field: "profilephoto",
        message: "Profile photo is required",
      });
    }

    const existingUser = await User.findOne({
      email: req.body.email,
    });

    if (existingUser) {
      return res.status(409).json({
        field: "email",
        message: "Email already exists",
      });
    }

    const hashedpassword = await bcrypt.hash(req.body.password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedpassword,
      gender: req.body.gender,
      dob: req.body.dob,
      profilephoto: req.file.filename,
      role: "user",
      isVerified: false,
      verificationToken: verificationToken,
    });

    await user.save();
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    await sendEmail(
      user.email,
      "Verify Your Email",
      `
    <div style="
      max-width:600px;
      margin:auto;
      padding:30px;
      font-family:Arial,sans-serif;
      border:1px solid #1e1a1a;
      border-radius:10px;
    ">
      <h1 style="color:#2563eb;">
        UserHub
      </h1>

      <h2>Welcome to UserHub 🎉</h2>

      <p>
        Thank you for creating your account.
      </p>

      <p>
        Please verify your email address by clicking the button below.
      </p>

      <a
        href="${verificationLink}"
        style="
          display:inline-block;
          background:#2563eb;
          color:white;
          text-decoration:none;
          padding:12px 24px;
          border-radius:6px;
          margin-top:10px;
        "
      >
        Verify Email
      </a>

      <p style="margin-top:20px;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p style="
        word-break:break-all;
        color:#2563eb;
      ">
        ${verificationLink}
      </p>

      <p style="margin-top:20px;">
        If you did not create this account, you can safely ignore this email.
      </p>

      <hr />

      <small>
        © 2026 UserHub. All rights reserved.
      </small>
    </div>
  `,
    );
    return res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const loginuser = async (req, res) => {
  const { error } = loginschema.validate(req.body);
  if (error) {
    return res.status(400).json({
      field: error.details[0].path[0],
      message: error.details[0].message,
    });
  }

  const { email, password, deviceId } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      field: "email",
      message: "Invalid Email",
    });
  }

  // 1. Account Lockout Check
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingMinutes = Math.ceil(
      (user.lockUntil.getTime() - Date.now()) / (60 * 1000),
    );
    return res.status(403).json({
      field: "email",
      message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      isLocked: true,
      remainingMinutes,
    });
  }
  if (!user.isVerified) {
    return res.status(400).json({
      field: "email",
      message: "Please verify your email first",
    });
  }

  // 2. Password Check
  const ismatch = await bcrypt.compare(password, user.password);

  if (!ismatch) {
    const MAX_ATTEMPTS = 5;
    const LOCK_TIME_MS = 15 * 60 * 1000;

    user.loginAttempts = (user.loginAttempts || 0) + 1;

    if (user.loginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      await user.save();

      return res.status(403).json({
        field: "password",
        message:
          "Too many failed login attempts. Your account has been locked for 15 minutes for security.",
        isLocked: true,
        remainingMinutes: 15,
      });
    }

    await user.save();
    const remainingAttempts = MAX_ATTEMPTS - user.loginAttempts;

    return res.status(400).json({
      field: "password",
      message: `Invalid password. You have ${remainingAttempts} attempt(s) left before account lockout.`,
      remainingAttempts,
    });
  }

  // Reset login attempts on correct password
  if (user.loginAttempts > 0 || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = null;
  }

  // 3. 🛡️ DEVICE CHECK: Known vs Unknown Device
  const currentUA = req.headers["user-agent"] || "Unknown Browser / Device";
  const currentIp =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    req.ip ||
    "127.0.0.1";

  // Check if deviceId is in trustedDevices list
  const isKnownDevice =
    deviceId &&
    user.trustedDevices &&
    user.trustedDevices.some((d) => d.deviceId === deviceId);

  // ── UNKNOWN DEVICE: Send OTP & Require 2FA ──
  if (!isKnownDevice) {
    // 6-digit random OTP generate karo
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 [LOGIN OTP for ${user.email}]: ${otp}`);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    user.loginOtp = otp;
    user.loginOtpExpire = otpExpiry;
    await user.save();

    // Send OTP email
    try {
      await sendEmail(
        user.email,
        "Your Login Verification OTP - UserHub",
        `
        <div style="max-width:550px; margin:auto; padding:25px; font-family:Arial,sans-serif; border:1px solid #e2e8f0; border-radius:10px; background:#ffffff;">
          <h2 style="color:#2563eb; margin-bottom:5px;">UserHub Security Verification</h2>
          <p style="color:#475569; font-size:15px;">A login attempt was made from a new or unrecognized device.</p>
          <div style="background:#f1f5f9; padding:20px; text-align:center; border-radius:8px; margin:20px 0;">
            <span style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#1e293b;">${otp}</span>
          </div>
          <p style="color:#64748b; font-size:14px;">This code is valid for <strong>5 minutes</strong>. If you did not attempt this login, please change your password immediately.</p>
        </div>
        `,
      );
    } catch (err) {
      console.error("Error sending OTP email:", err.message);
    }

    return res.status(200).json({
      requireOtp: true,
      message:
        "Unrecognized device detected. A 6-digit OTP has been sent to your email.",
      email: user.email,
    });
  }

  // ── KNOWN DEVICE: Direct JWT Generation ──
  const sessionId = uuidv4();
  const { browser, os, device } = getDeviceInfo(req.headers["user-agent"]);

  await Session.create({
    userId: user._id,
    sessionId,
    deviceId,
    browser,
    os,
    device,
    ipAddress: currentIp,
  });

  user.lastLogin = new Date();
  user.lastDeviceInfo = {
    userAgent: currentUA,
    ip: currentIp,
    lastLoginAt: new Date(),
  };
  await user.save();

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      sessionId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  const userData = user.toObject();
  delete userData.password;
  delete userData.resetPasswordToken;
  delete userData.resetPasswordExpire;
  delete userData.loginOtp;
  delete userData.loginOtpExpire;

  return res.json({
    message: "Login Successfully",
    token,
    role: user.role,
    user: userData,
  });
};

const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp, deviceId } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // OTP match aur expiry check
    if (!user.loginOtp || user.loginOtp !== otp.trim()) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please check and try again." });
    }

    if (user.loginOtpExpire && user.loginOtpExpire < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // OTP verified -> Clear OTP fields
    user.loginOtp = null;
    user.loginOtpExpire = null;

    // 🛡️ TRUST THIS DEVICE: Add to trustedDevices list
    const currentUA = req.headers["user-agent"] || "Unknown Browser / Device";
    const currentIp =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      req.ip ||
      "127.0.0.1";

    if (deviceId) {
      const alreadyTrusted = user.trustedDevices?.some(
        (d) => d.deviceId === deviceId,
      );
      if (!alreadyTrusted) {
        user.trustedDevices.push({
          deviceId,
          userAgent: currentUA,
          ip: currentIp,
          trustedAt: new Date(),
        });
      }
    }

    // Create session
    const sessionId = uuidv4();
    const { browser, os, device } = getDeviceInfo(req.headers["user-agent"]);

    await Session.create({
      userId: user._id,
      sessionId,
      deviceId,
      browser,
      os,
      device,
      ipAddress: currentIp,
    });

    user.lastLogin = new Date();
    user.lastDeviceInfo = {
      userAgent: currentUA,
      ip: currentIp,
      lastLoginAt: new Date(),
    };
    await user.save();

    // JWT sign
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const userData = user.toObject();
    delete userData.password;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpire;
    delete userData.loginOtp;
    delete userData.loginOtpExpire;

    return res.status(200).json({
      message: "Device verified and Login successful!",
      token,
      role: user.role,
      user: userData,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};




const resendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const COOLDOWN_MS = 60 * 1000; // 1 minute cooldown
    if (
      user.lastOtpSentAt &&
      Date.now() - user.lastOtpSentAt.getTime() < COOLDOWN_MS
    ) {
      const remainingSeconds = Math.ceil(
        (COOLDOWN_MS - (Date.now() - user.lastOtpSentAt.getTime())) / 1000,
      );
      return res.status(429).json({
        message: `Please wait ${remainingSeconds}s before requesting a new OTP.`,
        remainingSeconds,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOtp = otp;
    user.loginOtpExpire = new Date(Date.now() + 5 * 60 * 1000);
    user.lastOtpSentAt = new Date(); // ✅ Cooldown timestamp update
    await user.save();

    await sendEmail(
      user.email,
      "Your New Login Verification OTP - UserHub",
      `
      <div style="max-width:550px; margin:auto; padding:25px; font-family:Arial,sans-serif; border:1px solid #e2e8f0; border-radius:10px; background:#ffffff;">
        <h2 style="color:#2563eb;">UserHub Security Verification</h2>
        <p style="color:#475569;">Here is your new OTP code for login:</p>
        <div style="background:#f1f5f9; padding:20px; text-align:center; border-radius:8px; margin:20px 0;">
          <span style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#1e293b;">${otp}</span>
        </div>
        <p style="color:#64748b; font-size:14px;">Valid for 5 minutes.</p>
      </div>
      `,
    );

    return res
      .status(200)
      .json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const forgotpassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Email not found",
      });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    const resetlink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await user.save();
    await sendEmail(
      user.email,
      "Reset Password",
      `<div style="
      max-width:600px;
      margin:auto;
      padding:30px;
      font-family:Arial,sans-serif;
      border:1px solid #ddd;
      border-radius:10px;
    ">
      <h1 style="color:#2563eb;">
        UserHub
      </h1>

      <h2>Password Reset Request</h2>

      <p>
        We received a request to reset your password.
      </p>

      <p>
        Click the button below to create a new password.
      </p>
      
      <a
        href="${resetlink}"
        style="
          display:inline-block;
          background:#2563eb;
          color:white;
          text-decoration:none;
          padding:12px 24px;
          border-radius:6px;
          margin-top:10px;
        "
      >
        Reset Password
      </a>
      <p style="margin-top:20px;">
        This link will expire in 15 minutes.
      </p>

      <p>
        If you did not request this password reset,
        please ignore this email.
      </p>
      <hr />

      <small>
        © 2026 UserHub. All rights reserved.
      </small>
    </div>
  `,
    );

    return res.status(200).json({
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getSessions = async (req, res) => {
  try {
    const currentSessionId = req.user.sessionId;

    const sessions = await Session.find({
      userId: req.user.id,
    }).sort({
      createdAt: -1,
    });

    const formattedSessions = sessions.map((s) => ({
      sessionId: s.sessionId,
      browser: s.browser,
      os: s.os,
      device: s.device,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      isCurrent: s.sessionId === currentSessionId,
    }));

    res.status(200).json(formattedSessions);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

const logoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (sessionId === req.user.sessionId) {
      return res.status(400).json({
        message:
          "Cannot revoke your current active device session from here. Use the main Logout button.",
      });
    }

    const session = await Session.findOne({
      sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (session.deviceId) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: {
          trustedDevices: { deviceId: session.deviceId },
        },
      });
    }

    await Session.deleteOne({
      sessionId,
      userId: req.user.id,
    });

    return res.status(200).json({
      message: "Session revoked successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
const logoutCurrentDevice = async (req, res) => {
  try {
    await Session.deleteOne({
      sessionId: req.user.sessionId,
      userId: req.user.id,
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
const logoutOtherSessions = async (req, res) => {
  try {
    // 1. Baaki saare sessions find karo taaki unke deviceIds nikal sakein
    const otherSessions = await Session.find({
      userId: req.user.id,
      sessionId: {
        $ne: req.user.sessionId,
      },
    });

    const otherDeviceIds = otherSessions.map((s) => s.deviceId).filter(Boolean);

    // 2. 🛡️ UNTRUST ALL OTHER DEVICES: user.trustedDevices se un sabhi ko hata do
    if (otherDeviceIds.length > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: {
          trustedDevices: { deviceId: { $in: otherDeviceIds } },
        },
      });
    }

    // 3. Baaki saare sessions delete karo
    await Session.deleteMany({
      userId: req.user.id,
      sessionId: {
        $ne: req.user.sessionId,
      },
    });

    return res.status(200).json({
      message: "Other devices logged out and untrusted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      field: "password",
      message: error.message,
    });
  }
};
module.exports = {
  registeruser,
  loginuser,
  forgotpassword,
  resetPassword,
  logoutCurrentDevice,
  logoutOtherSessions,
  getSessions,
  logoutSession,
  resendLoginOtp,
  verifyLoginOtp,
};
