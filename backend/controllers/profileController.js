const User = require("../models/user");
const { updateUserSchema } = require("../validations/validate");
const { changePasswordValidation } = require("../validations/validate");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const createNotification = require("../utils/createNotification");
const emailTemplates = require("../utils/emailTemplates");

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
const updateProfile = async (req, res) => {
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
    const isEmailChanging = requestedEmail && requestedEmail !== currentUser.email.toLowerCase().trim();

    if (isEmailChanging) {
      const existingUser = await User.findOne({
        email: requestedEmail,
        _id: { $ne: req.user.id },
      });

      if (existingUser) {
        return res.status(409).json({
          field: "email",
          message: "Email already exists",
        });
      }
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
      gender: req.body.gender,
      dob: req.body.dob,
      phone: req.body.phone,
      bio: req.body.bio,
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
    };

    if (req.file) {
      updateData.profilephoto = req.file.filename;
    }

    // If email is NOT changing, update with current email
    if (!isEmailChanging) {
      updateData.email = currentUser.email;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -resetPasswordToken -resetPasswordExpire");

    // ── IF EMAIL IS CHANGING: Generate 6-digit OTP & Send to New Email ──
    if (isEmailChanging) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashotp = crypto.createHash("sha256").update(otp).digest("hex");
      console.log(`🔐 [EMAIL CHANGE OTP for ${requestedEmail}]: ${otp}`);

      currentUser.pendingEmail = requestedEmail;
      currentUser.emailChangeOtp = hashotp;
      currentUser.emailChangeOtpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await currentUser.save();

      // Send OTP to NEW email address
      sendEmail(
        requestedEmail,
        "Verify Your New Email Address - UserHub",
        emailTemplates.selfEmailChangeOtpEmail({
          name: currentUser.name,
          newEmail: requestedEmail,
          otp,
        })
      ).catch((err) => console.error("Error sending email change OTP:", err.message));

      // Send Security Notice to the OLD email address (ZERO OTP in this message)
      sendEmail(
        currentUser.email,
        "[Security Notice] Email change requested for your UserHub account",
        emailTemplates.oldEmailChangeNoticeTemplate({
          name: currentUser.name,
          oldEmail: currentUser.email,
          newEmail: requestedEmail,
          changedBy: "you in Edit Profile",
        })
      ).catch((err) => console.error("Error sending old email security notice:", err.message));

      return res.status(200).json({
        success: true,
        requireEmailOtp: true,
        newEmail: requestedEmail,
        message: `Profile details saved! A 6-digit verification code has been sent to ${requestedEmail}. Please verify to confirm your new email.`,
        user: updatedUser,
      });
    }

    return res.status(200).json({
      success: true,
      requireEmailOtp: false,
      message: "Profile Updated Successfully",
      user: updatedUser,
    });
  } catch (error) {
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

    if (!user.pendingEmail || !user.emailChangeOtp || !user.emailChangeOtpExpire) {
      return res.status(400).json({
        message: "No pending email change request found. Please submit the form again.",
      });
    }

    if (user.emailChangeOtpExpire < new Date()) {
      return res.status(400).json({
        field: "otp",
        message: "Verification code has expired. Please request a new code.",
        isExpired: true,
      });
    }

    const hashotp = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    if (hashotp !== user.emailChangeOtp) {
      return res.status(400).json({
        field: "otp",
        message: "Invalid verification code. Please check and try again.",
      });
    }

    // Check if pendingEmail was registered by someone else in the meantime
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
    user.isVerified = true;
    await user.save();

    // 📧 Confirmation to NEW email address
    sendEmail(
      newEmail,
      "Email Address Successfully Updated - UserHub",
      emailTemplates.emailChangeSuccessTemplate({
        name: user.name,
        newEmail,
      })
    ).catch((err) => console.error("Error sending new email success notice:", err.message));

    // 📧 Security Notice to the OLD email address
    sendEmail(
      oldEmail,
      "[Security Notice] Your UserHub account email was updated",
      emailTemplates.oldEmailChangeNoticeTemplate({
        name: user.name,
        oldEmail,
        newEmail,
        changedBy: "you",
      })
    ).catch((err) => console.error("Error sending old email alert:", err.message));

    // 🔔 In-App Security Notification
    await createNotification({
      userId: user._id,
      type: "security_login",
      title: "Security Alert: Email Updated",
      message: `Your account email was successfully updated to ${newEmail}.`,
    });

    const sanitizedUser = await User.findById(user._id).select(
      "-password -resetPasswordToken -resetPasswordExpire"
    );

    return res.status(200).json({
      success: true,
      message: "Email updated and verified successfully!",
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
    console.log(`🔐 [RESEND EMAIL CHANGE OTP for ${user.pendingEmail}]: ${otp}`);

    user.emailChangeOtp = hashotp;
    user.emailChangeOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendEmail(
      user.pendingEmail,
      "Your New Email Verification Code - UserHub",
      emailTemplates.selfEmailChangeOtpEmail({
        name: user.name,
        newEmail: user.pendingEmail,
        otp,
      })
    ).catch((err) => {
      console.error("Error resending email change OTP:", err.message);
    });

    return res.status(200).json({
      success: true,
      message: `A new verification code has been sent to ${user.pendingEmail}.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const deleteProfile = async (req, res) => {
  await User.findByIdAndDelete(req.user.id);

  res.json({
    message: "Account Deleted",
  });
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

    // 🔔 In-App Notification: Password Change
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

module.exports = {
  getProfile,
  updateProfile,
  verifyEmailChangeOtp,
  resendEmailChangeOtp,
  deleteProfile,
  changepassword,
  addExperience,
  updateExperienceItem,
  deleteExperienceItem,
  updateNotificationPreferences,
};
