const User = require("../models/user");

const { changePasswordValidation } = require("../validations/validate");
const bcrypt = require("bcrypt");

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
  try {
    const existingUser = await User.findOne({
      email: req.body.email,
      _id: { $ne: req.user.id },
    });

    if (existingUser) {
      return res.status(409).json({
        field: "email",
        message: "Email already exists",
      });
    }

    const updateData = {
      name: req.body.name,
      email: req.body.email,
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

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -resetPasswordToken -resetPasswordExpire");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile Updated Successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
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
  deleteProfile,
  changepassword,
  addExperience,
  updateExperienceItem,
  deleteExperienceItem,
  updateNotificationPreferences,
};
