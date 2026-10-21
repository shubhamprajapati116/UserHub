const User = require("../models/user");
const Session = require("../models/session");
const Notification = require("../models/notification");
const { updateUserSchema } = require("../validations/validate");
const { changePasswordValidation } = require("../validations/validate");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const createNotification = require("../utils/createNotification");
const emailTemplates = require("../utils/emailTemplates");
const jwt = require("jsonwebtoken");
const { deleteFile } = require("../utils/fileHelper");
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const updateProfilePhoto = async (req, res) => { 
  try {
    if (!req.file) {
      return res.status(400).json({
        field: "profilephoto",
        message: "Please select an image file to upload",
      });
    }

    const currentUser = await User.findById(req.user.id).select("profilephoto");
    if (!currentUser) {
      deleteFile(req.file.filename);
      return res.status(404).json({ message: "User not found" });
    }

    const oldPhoto = currentUser.profilephoto;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilephoto: req.file.filename },
      { new: true },
    ).select("-password -resetPasswordToken -resetPasswordExpire");

    if (oldPhoto && oldPhoto !== req.file.filename) {
      deleteFile(oldPhoto);
    }

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      profilephoto: updatedUser.profilephoto,
      user: updatedUser,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.filename);
    return res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  if (req.file && !req.body.name && !req.body.email) {
    return updateProfilePhoto(req, res);
  }

  const { error } = updateUserSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      field: error.details[0].path[0],
      message: error.details[0].message,
    });
  }

  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const requestedEmail = req.body.email?.toLowerCase().trim();
    const isEmailChanging =
      requestedEmail &&
      requestedEmail !== currentUser.email.toLowerCase().trim();

    if (isEmailChanging) {
      return res.status(400).json({
        field: "email",
        message:
          "Email address changes must be performed through Security Settings with password re-authentication.",
      });
    }

    if (req.body.phone) {
      const existingPhoneUser = await User.findOne({
        phone: req.body.phone,
        _id: { $ne: req.user.id },
      });

      if (existingPhoneUser) {
        return res.status(409).json({
          field: "phone",
          message: "Phone number already exists",
        });
      }
    }

    const updateData = {
      name: req.body.name,
      email: currentUser.email,
      gender: req.body.gender,
      dob: req.body.dob,
      phone: req.body.phone,
      bio: req.body.bio,
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
    };

    if (req.body.profileBanner !== undefined) {
      updateData.profileBanner = req.body.profileBanner;
    }

    const oldPhoto = currentUser.profilephoto;

    if (req.file) {
      updateData.profilephoto = req.file.filename;
      if (oldPhoto && oldPhoto !== req.file.filename) {
        deleteFile(oldPhoto);
      }
    } else if (
      req.body.removePhoto === "true" ||
      req.body.removePhoto === true ||
      req.body.profilephoto === ""
    ) {
      updateData.profilephoto = "";
      if (oldPhoto) {
        deleteFile(oldPhoto);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -resetPasswordToken -resetPasswordExpire");

    return res.status(200).json({
      success: true,
      requireEmailOtp: false,
      message: "Profile Updated Successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.filename);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const verifyEmailChangeOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return res.status(400).json({
        field: "otp",
        message: "Please enter a valid 6-digit verification code.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      !user.pendingEmail ||
      !user.emailChangeOtp ||
      !user.emailChangeOtpExpire
    ) {
      return res.status(400).json({
        message:
          "No pending email change request found. Please submit the form again.",
      });
    }

    if (user.emailChangeOtpExpire < new Date()) {
      return res.status(400).json({
        field: "otp",
        message: "Verification code has expired. Please request a new code.",
        isExpired: true,
      });
    }

    const hashotp = crypto
      .createHash("sha256")
      .update(otp.trim())
      .digest("hex");
    if (hashotp !== user.emailChangeOtp) {
      return res.status(400).json({
        field: "otp",
        message: "Invalid verification code. Please check and try again.",
      });
    }

    const existing = await User.findOne({
      email: user.pendingEmail,
      _id: { $ne: user._id },
    });

    if (existing) {
      return res.status(409).json({
        message: "This email address is already registered to another account.",
      });
    }

    const oldEmail = user.email;
    const newEmail = user.pendingEmail;

    user.email = newEmail;
    user.pendingEmail = null;
    user.emailChangeOtp = null;
    user.emailChangeOtpExpire = null;
    user.emergencyLockToken = null;
    user.emergencyLockExpire = null;
    user.isVerified = true;
    await user.save();

    sendEmail(
      newEmail,
      "Email Address Successfully Updated - UserHub",
      emailTemplates.emailChangeSuccessTemplate({
        name: user.name,
        newEmail,
      }),
    ).catch((err) =>
      console.error("Error sending new email success notice:", err.message),
    );

    sendEmail(
      oldEmail,
      "[Security Notice] Your UserHub account email was updated",
      emailTemplates.oldEmailChangeNoticeTemplate({
        name: user.name,
        oldEmail,
        newEmail,
        changedBy: "you",
      }),
    ).catch((err) =>
      console.error("Error sending old email alert:", err.message),
    );

    await createNotification({
      userId: user._id,
      type: "security_login",
      title: "Security Alert: Email Updated",
      message: `Your account email was successfully updated to ${newEmail}.`,
    });

    const sanitizedUser = await User.findById(user._id).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        sessionId: req.user?.sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      success: true,
      message: "Email updated and verified successfully!",
      token,
      user: sanitizedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resendEmailChangeOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.pendingEmail) {
      return res.status(400).json({
        message: "No pending email change request found.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashotp = crypto.createHash("sha256").update(otp).digest("hex");
    console.log(`🔐 [RESEND EMAIL CHANGE OTP for ${user.email}]: ${otp}`);

    const rawEmergencyToken = crypto.randomBytes(32).toString("hex");
    const hashedEmergencyToken = crypto
      .createHash("sha256")
      .update(rawEmergencyToken)
      .digest("hex");

    user.emailChangeOtp = hashotp;
    user.emailChangeOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    user.emergencyLockToken = hashedEmergencyToken;
    user.emergencyLockExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const emergencyRevokeUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/security/emergency-lock/${rawEmergencyToken}`;

    sendEmail(
      user.pendingEmail,
      "Verify Your New Email Address - UserHub",
      emailTemplates.selfEmailChangeOtpEmail({
        name: user.name,
        newEmail: user.pendingEmail,
        otp,
      }),
    ).catch((err) => {
      console.error("Error resending email change OTP:", err.message);
    });

    return res.status(200).json({
      success: true,
      pendingEmail: user.pendingEmail,
      message: `A new verification code has been sent to your new email (${user.pendingEmail}).`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const cancelEmailChange = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.pendingEmail = null;
    user.emailChangeOtp = null;
    user.emailChangeOtpExpire = null;
    user.emergencyLockToken = null;
    user.emergencyLockExpire = null;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    const sanitizedUser = await User.findById(user._id).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );

    return res.status(200).json({
      success: true,
      message: "Email change request cancelled successfully.",
      user: sanitizedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select("profilephoto");
    if (user?.profilephoto) {
      deleteFile(user.profilephoto);
    }

    await User.findByIdAndDelete(userId);
    await Session.deleteMany({ userId }).catch(() => {});
    await Notification.deleteMany({ userId }).catch(() => {});

    return res.json({
      message: "Account Deleted",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const changepassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { error } = changePasswordValidation(req.body);

    if (error) {
      return res.status(400).json({
        field: error.details[0].path[0],
        message: error.details[0].message,
      });
    }
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    const ismatch = await bcrypt.compare(currentPassword, user.password);
    if (!ismatch) {
      return res.status(400).json({
        field: "currentPassword",
        message: "Current password is incorrect",
      });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        field: "newPassword",
        message: "New password must be different from current password",
      });
    }
    const hashpassword = await bcrypt.hash(newPassword, 10);
    user.password = hashpassword;
    await user.save();

    if (req.user?.sessionId) {
      await Session.deleteMany({
        userId: user._id,
        sessionId: { $ne: req.user.sessionId },
      }).catch(() => {});
    } else {
      await Session.deleteMany({ userId: user._id }).catch(() => {});
    }

    await createNotification({
      userId: user._id,
      type: "password_change",
      title: "Security Update",
      message: "Your password has been changed successfully.",
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
const addExperience = async (req, res) => {
  try {
    const {
      title,
      company,
      employmentType,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
    } = req.body;
    if (!title || !company || !startDate) {
      return res
        .status(400)
        .json({ message: "Title, Company, and Start Date are required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.experience.unshift({
      title,
      company,
      employmentType: employmentType || "Full-time",
      location: location || "",
      startDate,
      endDate: isCurrent ? null : endDate,
      isCurrent: Boolean(isCurrent),
      description: description || "",
    });

    await user.save();
    return res
      .status(200)
      .json({ message: "Experience added successfully", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateExperienceItem = async (req, res) => {
  try {
    const { expId } = req.params;
    const {
      title,
      company,
      employmentType,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
    } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const expItem = user.experience.id(expId);

    if (!expItem)
      return res.status(404).json({ message: "Experience entry not found" });

    if (title) expItem.title = title;
    if (company) expItem.company = company;
    if (employmentType) expItem.employmentType = employmentType;
    if (location !== undefined) expItem.location = location;
    if (startDate) expItem.startDate = startDate;
    expItem.isCurrent = Boolean(isCurrent);
    expItem.endDate = isCurrent ? null : endDate;
    if (description !== undefined) expItem.description = description;

    await user.save();
    return res
      .status(200)
      .json({ message: "Experience updated successfully", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteExperienceItem = async (req, res) => {
  try {
    const { expId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.experience = user.experience.filter(
      (item) => item._id.toString() !== expId,
    );
    await user.save();

    return res
      .status(200)
      .json({ message: "Experience deleted successfully", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const { securityLoginAlerts } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        securityLoginAlerts: true,
      };
    }

    if (securityLoginAlerts !== undefined) {
      user.notificationPreferences.securityLoginAlerts =
        Boolean(securityLoginAlerts);
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;
    delete updatedUser.resetPasswordToken;
    delete updatedUser.resetPasswordExpire;

    return res.status(200).json({
      message: "Notification preferences updated successfully",
      notificationPreferences: user.notificationPreferences,
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    const { profileBanner } = req.body;
    if (!profileBanner) {
      return res.status(400).json({ message: "Banner identifier is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profileBanner },
      { new: true },
    ).select("-password -resetPasswordToken -resetPasswordExpire");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      profileBanner: updatedUser.profileBanner,
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const requestEmailChange = async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || typeof newEmail !== "string" || !newEmail.trim()) {
      return res.status(400).json({
        field: "newEmail",
        message: "Please enter a valid new email address.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedNewEmail = newEmail.trim().toLowerCase();

    if (!emailPattern.test(normalizedNewEmail)) {
      return res.status(400).json({
        field: "newEmail",
        message: "Please enter a valid email format.",
      });
    }

    if (!password) {
      return res.status(400).json({
        field: "password",
        message: "Current password is required to change email.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (normalizedNewEmail === user.email.toLowerCase()) {
      return res.status(400).json({
        field: "newEmail",
        message: "New email address must be different from your current email.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        field: "password",
        message: "Incorrect current password. Please try again.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedNewEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res.status(409).json({
        field: "newEmail",
        message: "This email address is already in use by another account.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashotp = crypto.createHash("sha256").update(otp).digest("hex");
    console.log(
      `🔐 [EMAIL CHANGE OTP for ${user.email} -> ${normalizedNewEmail}]: ${otp}`,
    );

    const rawEmergencyToken = crypto.randomBytes(32).toString("hex");
    const hashedEmergencyToken = crypto
      .createHash("sha256")
      .update(rawEmergencyToken)
      .digest("hex");

    user.pendingEmail = normalizedNewEmail;
    user.emailChangeOtp = hashotp;
    user.emailChangeOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    user.emergencyLockToken = hashedEmergencyToken;
    user.emergencyLockExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const emergencyRevokeUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/security/emergency-lock/${rawEmergencyToken}`;

    sendEmail(
      normalizedNewEmail,
      "Verify Your New Email Address - UserHub",
      emailTemplates.selfEmailChangeOtpEmail({
        name: user.name,
        newEmail: normalizedNewEmail,
        otp,
      }),
    ).catch((err) =>
      console.error("Error sending new email verification OTP:", err.message),
    );

    sendEmail(
      user.email,
      "[Security Notice] Email change requested for your UserHub account",
      emailTemplates.oldEmailChangeNoticeTemplate({
        name: user.name,
        oldEmail: user.email,
        newEmail: normalizedNewEmail,
        changedBy: "you",
      }),
    ).catch((err) =>
      console.error("Error sending old email security notice:", err.message),
    );

    return res.status(200).json({
      success: true,
      pendingEmail: normalizedNewEmail,
      currentEmail: user.email,
      message: `A 6-digit verification code has been sent to your new email (${normalizedNewEmail}).`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const emergencyRevokeAccount = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).send("Invalid emergency lock request.");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      emergencyLockToken: hashedToken,
      emergencyLockExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?emergencyError=expired`,
      );
    }

    await Session.deleteMany({ userId: user._id }).catch(() => {});

    user.pendingEmail = null;
    user.emailChangeOtp = null;
    user.emailChangeOtpExpire = null;
    user.emergencyLockToken = null;
    user.emergencyLockExpire = null;

    const scrambledSecret = crypto.randomBytes(32).toString("hex");
    user.password = await bcrypt.hash(scrambledSecret, 10);

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}?emergency=true`;

    sendEmail(
      user.email,
      "🚨 Account Lockdown Activated - UserHub Security",
      emailTemplates.emergencyLockNoticeEmail({
        name: user.name,
        resetUrl,
      }),
    ).catch((err) =>
      console.error(
        "Error sending emergency lock confirmation email:",
        err.message,
      ),
    );

    return res.redirect(resetUrl);
  } catch (error) {
    console.error("Emergency revoke error:", error);
    return res.status(500).send("An error occurred during account lockdown.");
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  updateBanner,
  requestEmailChange,
  verifyEmailChangeOtp,
  resendEmailChangeOtp,
  cancelEmailChange,
  deleteProfile,
  changepassword,
  addExperience,
  updateExperienceItem,
  deleteExperienceItem,
  updateNotificationPreferences,
  emergencyRevokeAccount,
};
