const crypto = require("crypto");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const {
  userSchema,
  loginschema,
  acceptInviteSchema,
} = require("../validations/validate");
const { validateEmailDeliverability } = require("../utils/emailValidator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const uuidv4 = () => crypto.randomUUID();
const Session = require("../models/session");
const Notification = require("../models/notification");
const getDeviceInfo = require("../utils/getDeviceInfo");
const createNotification = require("../utils/createNotification");
const emailTemplates = require("../utils/emailTemplates");
const {
  getSessions,
  logoutSession,
  logoutCurrentDevice,
  logoutOtherSessions,
} = require("./sessionController");
const { deleteFile } = require("../utils/fileHelper");

const checkEmailAvailability = async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.trim()) {
      return res.status(400).json({
        field: "email",
        available: false,
        message: "Email is required",
      });
    }

    const email = rawEmail.trim().toLowerCase();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        field: "email",
        available: false,
        message:
          "Email is already registered. Please log in or use another email.",
      });
    }

    return res.status(200).json({
      available: true,
      message: "Email is available",
    });
  } catch (error) {
    return res.status(500).json({
      available: false,
      message: error.message,
    });
  }
};

const registeruser = async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);

    if (error) {
      if (req.file) deleteFile(req.file.filename);
      return res.status(400).json({
        field: error.details[0].path[0],
        message: error.details[0].message,
      });
    }

    const normalizedEmail = (req.body.email || "").trim().toLowerCase();

    const deliverability = await validateEmailDeliverability(normalizedEmail);
    if (!deliverability.valid) {
      if (req.file) deleteFile(req.file.filename);
      return res.status(400).json({
        field: "email",
        message: deliverability.reason,
        code: deliverability.code,
        suggestion: deliverability.suggestion,
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { pendingEmail: normalizedEmail }],
    });

    if (existingUser) {
      if (req.file) deleteFile(req.file.filename);
      return res.status(409).json({
        field: "email",
        message: "Email already exists",
      });
    }

    const hashedpassword = await bcrypt.hash(req.body.password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpire = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const user = new User({
      name: req.body.name.trim(),
      email: normalizedEmail,
      password: hashedpassword,
      gender: req.body.gender,
      dob: req.body.dob,
      profilephoto: req.file ? req.file.filename : "",
      role: "user",
      status: "active",
      isVerified: false,
      verificationToken: verificationToken,
      verificationTokenExpire: verificationTokenExpire,
    });

    await user.save();
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    try {
      await sendEmail(
        user.email,
        "Verify Your Email Address - UserHub",
        emailTemplates.registerVerificationEmail({
          name: user.name,
          verifyUrl: verificationLink,
        }),
      );
    } catch (mailError) {
      console.error("⚠️ [Registration Email Warning]:", mailError.message);
    }

    return res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.filename);
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

  if (user.status === "suspended") {
    return res.status(403).json({
      field: "email",
      isSuspended: true,
      message:
        "Your account has been suspended by administration. Contact support.",
    });
  }
  if (user.status === "banned") {
    return res.status(403).json({
      field: "email",
      isBanned: true,
      message: "Your account has been permanently banned by administration.",
    });
  }
  if (user.inviteStatus === "pending") {
    return res.status(403).json({
      field: "email",
      isPendingInvite: true,
      email: user.email,
      message:
        "Your account invitation is pending. Please check your email inbox to accept the invitation and set your password.",
    });
  }
  if (!user.isVerified) {
    return res.status(403).json({
      field: "email",
      isUnverified: true,
      email: user.email,
      message: "Please verify your email address before logging in.",
    });
  }

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

  if (user.loginAttempts > 0 || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = null;
  }

  const currentUA = req.headers["user-agent"] || "Unknown Browser / Device";
  const currentIp =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    req.ip ||
    "127.0.0.1";

  const isKnownDevice =
    deviceId &&
    user.trustedDevices &&
    user.trustedDevices.some((d) => d.deviceId === deviceId);

  if (!isKnownDevice) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashotp = crypto.createHash("sha256").update(otp).digest("hex");
    console.log(`🔐 [LOGIN OTP for ${user.email}]: ${otp}`);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.loginOtp = hashotp;
    user.loginOtpExpire = otpExpiry;
    await user.save();

    const { browser, os, device } = getDeviceInfo(req.headers["user-agent"]);
    const deviceDesc =
      browser && os ? `${browser} on ${os}` : browser || os || "Unknown Device";

    sendEmail(
      user.email,
      "Your Login Verification Code - UserHub",
      emailTemplates.loginOtpEmail({
        name: user.name,
        otp,
        deviceDesc,
      }),
    ).catch((err) => {
      console.error("Error sending OTP email:", err.message);
    });

    return res.status(200).json({
      requireOtp: true,
      message: user.lastLogin
        ? "Unrecognized device detected. A 6-digit OTP has been sent to your email."
        : "A 6-digit verification code has been sent to your email.",
      email: user.email,
    });
  }

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
    { expiresIn: "7d" },
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

    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp.trim())
      .digest("hex");

    if (!user.loginOtp || user.loginOtp !== hashedOtp) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please check and try again." });
    }

    if (user.loginOtpExpire && user.loginOtpExpire < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    user.loginOtp = null;
    user.loginOtpExpire = null;

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
    const isFirstEverLogin = !user.lastLogin;
    user.lastLogin = new Date();
    user.lastDeviceInfo = {
      userAgent: currentUA,
      ip: currentIp,
      lastLoginAt: new Date(),
    };
    await user.save();

    const deviceDesc =
      browser && os ? `${browser} on ${os}` : browser || os || "Unknown Device";

    if (isFirstEverLogin) {
      await createNotification({
        userId: user._id,
        type: "welcome",
        title: "Welcome to UserHub! 🎉",
        message:
          "Your account is successfully set up. Explore your dashboard and complete your profile.",
        metadata: { browser, os, device, ipAddress: currentIp },
      });
    } else {
      await createNotification({
        userId: user._id,
        type: "security_login",
        title: "Security Alert: New Device Login",
        message: `Your account was logged in from a new device (${deviceDesc}).`,
        metadata: {
          sourceSessionId: sessionId,
          sourceDeviceId: deviceId,
          browser,
          os,
          device,
          ipAddress: currentIp,
        },
      });

      const loginTime = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      const securityUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/settings`;

      sendEmail(
        user.email,
        `Security Alert: New sign-in to your account from ${deviceDesc}`,
        emailTemplates.newDeviceLoginAlertEmail({
          name: user.name,
          deviceDesc,
          currentIp,
          loginTime,
          securityUrl,
        }),
      ).catch((err) => {
        console.error("Failed to send security alert email:", err.message);
      });
    }
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
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
    const COOLDOWN_MS = 60 * 1000;
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
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.loginOtp = hashedOtp;
    user.loginOtpExpire = new Date(Date.now() + 5 * 60 * 1000);
    user.lastOtpSentAt = new Date();
    await user.save();

    sendEmail(
      user.email,
      "Your New Login Verification Code - UserHub",
      emailTemplates.loginOtpEmail({
        name: user.name,
        otp,
        deviceDesc: "your device",
      }),
    ).catch((err) => {
      console.error("Error sending resend OTP email:", err.message);
    });

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

    if (user.inviteStatus === "pending") {
      return res.status(400).json({
        isPendingInvite: true,
        message:
          "This account was invited by an administrator and has not been activated yet. Please check your email for the invitation link, or contact your administrator to resend it.",
      });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    const resetlink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await user.save();
    try {
      await sendEmail(
        user.email,
        "Reset Your Password - UserHub",
        emailTemplates.passwordResetEmail({
          name: user.name,
          resetUrl: resetlink,
          verifyUrl: resetlink,
        }),
      );
      return res.status(200).json({
        message: "Password reset link sent to your email",
      });
    } catch (mailError) {
      console.error("❌ [Forgot Password Email Error]:", mailError.message);
      return res.status(500).json({
        success: false,
        message:
          "Unable to send password reset email at this moment. Please try again later.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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

    await createNotification({
      userId: user._id,
      type: "password_change",
      title: "Security Update",
      message: "Your password has been changed successfully.",
    });

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
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        valid: false,
        message: "Invalid or expired password reset link",
      });
    }

    return res.status(200).json({
      valid: true,
      message: "Token is valid",
    });
  } catch (error) {
    return res.status(500).json({
      valid: false,
      message: error.message,
    });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email, token } = req.body;

    let user = null;
    if (token && typeof token === "string" && token.trim()) {
      user = await User.findOne({ verificationToken: token.trim() });
    }

    if (!user && email && typeof email === "string" && email.trim()) {
      const cleanEmail = email.toLowerCase().trim();
      user = await User.findOne({
        $or: [{ email: cleanEmail }, { pendingEmail: cleanEmail }],
      });
    }

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists, a fresh verification link has been sent.",
      });
    }

    if (user.isVerified && !user.pendingEmail) {
      return res.status(400).json({
        isAlreadyVerified: true,
        message: "This account is already verified. You can log in directly.",
      });
    }

    const COOLDOWN_MS = 60 * 1000;
    if (
      user.lastVerificationSentAt &&
      Date.now() - new Date(user.lastVerificationSentAt).getTime() < COOLDOWN_MS
    ) {
      const waitSeconds = Math.ceil(
        (COOLDOWN_MS -
          (Date.now() - new Date(user.lastVerificationSentAt).getTime())) /
          1000,
      );
      return res.status(429).json({
        message: `Please wait ${waitSeconds}s before requesting another verification link.`,
        waitSeconds,
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpire = new Date(Date.now() + 72 * 60 * 60 * 1000);
    user.lastVerificationSentAt = new Date();
    await user.save();

    const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email/${verificationToken}`;

    if (user.pendingEmail) {
      try {
        await sendEmail(
          user.pendingEmail,
          "Confirm Your New Email Address - UserHub",
          emailTemplates.adminEmailChangePendingVerificationEmail({
            name: user.name || "User",
            oldEmail: user.email,
            newEmail: user.pendingEmail,
            verifyUrl: verificationLink,
          }),
        );
        console.log(
          `✅ [Resend Verification]: Link dispatched to new email (${user.pendingEmail})`,
        );
      } catch (err) {
        console.error(
          "❌ [Resend Verification Error]: Failed to send to new email:",
          err.message,
        );
      }

      try {
        await sendEmail(
          user.email,
          "[Security Notice] Email change requested for your UserHub account",
          emailTemplates.oldEmailChangeNoticeTemplate({
            name: user.name || "User",
            oldEmail: user.email,
            newEmail: user.pendingEmail,
            changedBy: "an Administrator",
          }),
        );
        console.log(
          `✅ [Resend Verification]: Security alert sent to old email (${user.email})`,
        );
      } catch (err) {
        console.error(
          "❌ [Resend Verification Error]: Failed to send old email notice:",
          err.message,
        );
      }

      return res.status(200).json({
        success: true,
        message: `A fresh verification link has been sent to your new email (${user.pendingEmail}).`,
      });
    }

    try {
      await sendEmail(
        user.email,
        "Verify Your Email Address - UserHub",
        emailTemplates.registerVerificationEmail({
          name: user.name || "User",
          verifyUrl: verificationLink,
        }),
      );
    } catch (err) {
      console.error("❌ [Resend Verification Error]:", err.message);
    }

    return res.status(200).json({
      success: true,
      message: `A fresh verification link has been sent to ${user.email}. Please check your inbox and spam folder.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getInviteDetails = async (req, res) => {
  try {
    const rawToken = (req.params.token || "").trim();
    if (!rawToken) {
      return res
        .status(400)
        .json({ message: "No invitation token provided." });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await User.findOne({
      inviteTokenHash: tokenHash,
      inviteStatus: "pending",
    }).select("+inviteTokenHash");

    if (!user) {
      return res.status(404).json({
        valid: false,
        message:
          "Invalid or already used invitation link. If you already set your password, you can sign in directly.",
      });
    }

    if (user.inviteTokenExpire && user.inviteTokenExpire < new Date()) {
      return res.status(410).json({
        valid: false,
        isExpired: true,
        message:
          "This invitation link has expired (valid for 7 days). Please contact your administrator for a fresh invitation.",
        expiresAt: user.inviteTokenExpire,
      });
    }

    let invitedByName = "An Administrator";
    if (user.invitedBy) {
      const inviter = await User.findById(user.invitedBy).select("name");
      if (inviter?.name) invitedByName = inviter.name;
    }

    return res.status(200).json({
      valid: true,
      name: user.name,
      email: user.email,
      invitedByName,
      expiresAt: user.inviteTokenExpire,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const acceptInvite = async (req, res) => {
  try {
    const rawToken = (req.params.token || "").trim();
    if (!rawToken) {
      return res
        .status(400)
        .json({ message: "No invitation token provided." });
    }

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        field: "password",
        message: "Invalid request. Password is required.",
      });
    }

    const { error } = acceptInviteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        field: error.details && error.details[0]?.path ? error.details[0].path[0] : "password",
        message: error.details && error.details[0]?.message ? error.details[0].message : "Password is required",
      });
    }

    if (!req.body.password) {
      return res.status(400).json({
        field: "password",
        message: "Password is required.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await User.findOne({
      inviteTokenHash: tokenHash,
      inviteStatus: "pending",
    }).select("+inviteTokenHash");

    if (!user) {
      return res.status(404).json({
        message:
          "Invalid or already used invitation link. If you already activated your account, you can sign in directly.",
      });
    }

    if (user.inviteTokenExpire && user.inviteTokenExpire < new Date()) {
      return res.status(410).json({
        isExpired: true,
        message:
          "This invitation link has expired. Please contact your administrator to receive a fresh invitation.",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    user.password = hashedPassword;
    user.isVerified = true;
    user.inviteStatus = "accepted";
    user.inviteAcceptedAt = new Date();
    user.inviteTokenHash = null;
    user.inviteTokenExpire = null;
    user.status = "active";
    await user.save();

    const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
    try {
      await sendEmail(
        user.email,
        "Welcome to UserHub! Account Successfully Activated",
        emailTemplates.inviteAcceptedWelcomeEmail({
          name: user.name,
          loginUrl,
        }),
      );
    } catch (mailErr) {
      console.error("⚠️ [Welcome Email Failed]:", mailErr.message);
    }

    if (user.invitedBy) {
      createNotification({
        userId: user.invitedBy,
        type: "account_verified",
        title: "Invitation Accepted",
        message: `${user.name} (${user.email}) has accepted your invitation and activated their account.`,
        metadata: {
          acceptedUserId: user._id,
          acceptedUserEmail: user.email,
        },
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message:
        "Your invitation has been accepted and password set! You can now sign in.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkEmailAvailability,
  registeruser,
  loginuser,
  forgotpassword,
  resetPassword,
  verifyResetToken,
  logoutCurrentDevice,
  logoutOtherSessions,
  getSessions,
  logoutSession,
  resendLoginOtp,
  verifyLoginOtp,
  resendVerificationEmail,
  getInviteDetails,
  acceptInvite,
};

