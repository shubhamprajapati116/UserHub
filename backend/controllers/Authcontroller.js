const crypto = require("crypto");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const { userSchema, loginschema } = require("../validations/validate");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

  const { email, password } = req.body;

  const user = await User.findOne({
    email,
  });
  if (!user) {
    return res.status(400).json({
      field: "email",
      message: "Invalid Email",
    });
  }
  const ismatch = await bcrypt.compare(password, user.password);

  if (!user.isVerified) {
    return res.status(400).json({
      field: "email",
      message: "Please verify your email first",
    });
  }

  if (!ismatch) {
    return res.status(400).json({
      field: "password",
      message: "Invalid password",
    });
  }

  // Extract User Agent & Client IP
  const currentUA = req.headers["user-agent"] || "Unknown Browser / Device";
  const currentIp =
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "127.0.0.1";

  const isSecurityAlertEnabled =
    user.notificationPreferences?.securityLoginAlerts !== false;
  const previousUA = user.lastDeviceInfo?.userAgent;

  // Check if User-Agent is new or changed (or first time logging in)
  const isNewDevice = !previousUA || previousUA !== currentUA;

  if (isNewDevice && isSecurityAlertEnabled) {
    const loginTime = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    try {
      await sendEmail(
        user.email,
        "Security Alert: New Device Login Detected",
        `
        <div style="max-width:600px; margin:auto; padding:30px; font-family:Arial,sans-serif; border:1px solid #e2e8f0; border-radius:10px; background-color:#ffffff;">
          <h1 style="color:#2563eb; margin-bottom:10px;">UserHub Security</h1>
          <h2 style="color:#1e293b; font-size:20px;">New Device Login Detected</h2>
          <p style="color:#475569; font-size:15px; line-height:1.6;">
            A new login was detected on your <strong>UserHub</strong> account from a new browser or device.
          </p>
          <div style="background-color:#f8fafc; padding:15px; border-left:4px solid #2563eb; border-radius:4px; margin:20px 0;">
            <p style="margin:5px 0; color:#334155;"><strong>Time:</strong> ${loginTime} (IST)</p>
            <p style="margin:5px 0; color:#334155;"><strong>Device / Browser:</strong> ${currentUA}</p>
            <p style="margin:5px 0; color:#334155;"><strong>IP Address:</strong> ${currentIp}</p>
          </div>
          <p style="color:#64748b; font-size:14px;">
            If this was you, no action is needed.<br/>
            If you did not initiate this login, please change your password immediately to secure your account.
          </p>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin:25px 0;" />
          <small style="color:#94a3b8;">© 2026 UserHub Security Team. All rights reserved.</small>
        </div>
        `,
      );
    } catch (err) {
      console.error("❌ Error sending security email:", err.message);
    }
  }

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
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  const userData = user.toObject();
  delete userData.password;
  delete userData.resetPasswordToken;
  delete userData.resetPasswordExpire;
  // console.log("✅ Login successful for:", userData);
  res.json({
    message: "Login Successfully",
    token,
    role: user.role,
    user: userData,
  });
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
};
