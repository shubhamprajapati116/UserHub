const User = require("../models/user");

const { changePasswordValidation } = require("../validations/validate");
const bcrypt = require("bcrypt");

const getProfile = async (req, res) => {
  console.log("getProfile called");
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
   console.log("BODY:", req.body);
  console.log("FILE:", req.file);
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
module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,

  changepassword,
};
