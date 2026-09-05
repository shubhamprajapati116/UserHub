const User = require("../models/user");
const Session = require("../models/session");
const { userSchema, updateUserSchema } = require("../validations/validate");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const createNotification = require("../utils/createNotification");
const emailTemplates = require("../utils/emailTemplates");
const addUser = async (req, res) => {
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

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedpassword,
      gender: req.body.gender,
      dob: req.body.dob,
      profilephoto: req.file.filename,
      role: "user",
    });

    await user.save();

    return res.status(201).json({
      message: "User Added Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const currentUserId = req.user.id;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const gender = req.query.gender || "";
    const country = req.query.country || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const query = {
      _id: { $ne: currentUserId },
    };

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (role === "admin" || role === "user") {
      query.role = role;
    }

    if (gender) {
      query.gender = { $regex: gender, $options: "i" };
    }

    if (country) {
      query.country = { $regex: country, $options: "i" };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      users,
      totalUsers,
      verifiedUsersCount,
      adminUsersCount,
      todayUsersCount,
    ] = await Promise.all([
      User.find(query)
        .select(
          "-password -resetPasswordToken -resetPasswordExpire -verificationToken",
        )
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
      User.countDocuments({ ...query, isVerified: true }),
      User.countDocuments({ ...query, role: "admin" }),
      User.countDocuments({
        ...query,
        createdAt: { $gte: startOfToday, $lte: endOfToday },
      }),
    ]);
    res.json({
      users,
      totalUsers,
      stats: {
        verifiedUsersCount,
        adminUsersCount,
        todayUsersCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteuser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({
    message: "user deleted successfully",
  });
};
const updateuser = async (req, res) => {
  try {
    const { error } = updateUserSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        field: error.details[0].path[0],
        message: error.details[0].message,
      });
    }

    const existingUser = await User.findOne({
      email: req.body.email,
      _id: { $ne: req.params.id },
    });

    if (existingUser) {
      return res.status(409).json({
        field: "email",
        message: "Email already exists",
      });
    }

    if (req.body.phone) {
      const existingPhoneUser = await User.findOne({
        phone: req.body.phone,
        _id: { $ne: req.params.id },
      });

      if (existingPhoneUser) {
        return res.status(409).json({
          field: "phone",
          message: "Phone number already exists",
        });
      }
    }

    const previousUser = await User.findById(req.params.id);
    if (!previousUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const requestedEmail = req.body.email?.toLowerCase().trim();
    const isEmailChanging =
      requestedEmail &&
      requestedEmail !== previousUser.email.toLowerCase().trim();

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

    if (req.body.role && ["admin", "user"].includes(req.body.role)) {
      updateData.role = req.body.role;
    }

    if (req.file) {
      updateData.profilephoto = req.file.filename;
    }

    // ── IF ADMIN CHANGES EMAIL: Keep Current Email Active & Set Pending Email ──
    if (isEmailChanging) {
      updateData.email = previousUser.email; // ✅ Current email stays ACTIVE & SAFE!
      updateData.pendingEmail = requestedEmail; // ⏳ Naya email pending me store hoga
      const verificationToken = crypto.randomBytes(32).toString("hex");
      updateData.verificationToken = verificationToken;

      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

      // 1. 📧 Send Confirmation Link to the NEW email
      sendEmail(
        requestedEmail,
        "Confirm Your New Email Address - UserHub",
        emailTemplates.adminEmailChangePendingVerificationEmail({
          name: previousUser.name,
          oldEmail: previousUser.email,
          newEmail: requestedEmail,
          verifyUrl,
        }),
      ).catch((err) =>
        console.error(
          "Error sending admin update verification email:",
          err.message,
        ),
      );

      // 2. 📢 Send Security Alert to the OLD email
      sendEmail(
        previousUser.email,
        "[Security Notice] Email change requested for your UserHub account",
        emailTemplates.oldEmailChangeNoticeTemplate({
          name: previousUser.name,
          oldEmail: previousUser.email,
          newEmail: requestedEmail,
          changedBy: "an Administrator",
        }),
      ).catch((err) =>
        console.error("Error sending old email notice:", err.message),
      );

      // 3. 🔔 In-app security notification
      await createNotification({
        userId: req.params.id,
        type: "security_login",
        title: "Security Notice: Email Change Requested",
        message: `An administrator initiated a request to update your account email to ${requestedEmail}. A verification link was sent to the new address.`,
      });
    } else {
      updateData.email = previousUser.email;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // 🔔 In-App Notification: Role Update
    if (updateData.role && previousUser.role !== updateData.role) {
      await createNotification({
        userId: req.params.id,
        type: "role_update",
        title: "Role Updated",
        message: `An administrator updated your role from '${previousUser.role}' to '${updateData.role}'.`,
        metadata: { oldRole: previousUser.role, newRole: updateData.role },
      });
    }

    return res.status(200).json({
      message: isEmailChanging
        ? `User details updated! A verification link has been sent to ${requestedEmail}. The current email (${previousUser.email}) remains active until confirmed.`
        : "User Updated Successfully",
      isEmailChanging,
      pendingEmail: isEmailChanging ? requestedEmail : null,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const userObj = user.toObject();

    // If lastLogin is not directly set on user document, check Session history or lastDeviceInfo
    if (!userObj.lastLogin) {
      const latestSession = await Session.findOne({ userId: user._id })
        .sort({ createdAt: -1 })
        .select("createdAt");

      if (latestSession && latestSession.createdAt) {
        userObj.lastLogin = latestSession.createdAt;
      } else if (userObj.lastDeviceInfo && userObj.lastDeviceInfo.lastLoginAt) {
        userObj.lastLogin = userObj.lastDeviceInfo.lastLoginAt;
      }
    }

    // Ensure createdAt is always guaranteed for any document
    if (!userObj.createdAt && userObj._id) {
      const timestamp =
        parseInt(userObj._id.toString().substring(0, 8), 16) * 1000;
      userObj.createdAt = new Date(timestamp);
    }

    return res.status(200).json(userObj);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const makeAdmin = async (req, res) => {
  try {
    const targetuser = await User.findById(req.params.id);

    if (targetuser.role === "admin") {
      return res.status(400).json({
        message: "User is already an admin",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        role: "admin",
      },
      {
        returnDocument: "after",
      },
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 🔔 In-App Notification: Role updated to admin
    await createNotification({
      userId: user._id,
      type: "role_update",
      title: "Role Updated",
      message: `An administrator promoted your role to 'admin'.`,
      metadata: { oldRole: targetuser.role || "user", newRole: "admin" },
    });

    res.status(200).json({
      message: "User promoted to admin",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired verification link. Please request a new one.",
      });
    }

    const previousEmail = user.email;
    const isPendingEmailUpdate = !!user.pendingEmail;
    const confirmedNewEmail = user.pendingEmail;

    if (isPendingEmailUpdate) {
      // 🌟 Commit the pending email swap!
      user.email = confirmedNewEmail;
      user.pendingEmail = null;
      user.emailChangeOtp = null;
      user.emailChangeOtpExpire = null;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    if (isPendingEmailUpdate) {
      // 📧 Send confirmation success email to NEW email
      sendEmail(
        confirmedNewEmail,
        "Email Address Successfully Updated - UserHub",
        emailTemplates.emailChangeSuccessTemplate({
          name: user.name,
          newEmail: confirmedNewEmail,
        }),
      ).catch((err) =>
        console.error("Error sending update success notice:", err.message),
      );

      
      sendEmail(
        previousEmail,
        "[Security Notice] Your UserHub account email has been changed",
        emailTemplates.oldEmailChangeNoticeTemplate({
          name: user.name,
          oldEmail: previousEmail,
          newEmail: confirmedNewEmail,
          changedBy: "an Administrator",
        }),
      ).catch((err) =>
        console.error("Error sending old email notice:", err.message),
      );
    }

    return res.status(200).json({
      message: isPendingEmailUpdate
        ? `Your email address has been successfully verified and updated to ${confirmedNewEmail}!`
        : "Email verified successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const cancelPendingEmailChange = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.pendingEmail) {
      return res
        .status(400)
        .json({
          message: "No pending email change request found for this user.",
        });
    }

    const cancelledEmail = user.pendingEmail;
    user.pendingEmail = null;
    user.verificationToken = undefined;
    user.emailChangeOtp = null;
    user.emailChangeOtpExpire = null;
    await user.save();

    return res.status(200).json({
      message: `Pending email change request to ${cancelledEmail} has been cancelled.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "No user IDs provided" });
    }

    const currentUserId = req.user.id;
    const filteredIds = userIds.filter(
      (id) => id.toString() !== currentUserId.toString(),
    );

    const result = await User.deleteMany({ _id: { $in: filteredIds } });

    return res.status(200).json({
      message: `${result.deletedCount} user(s) deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const bulkUpdateRole = async (req, res) => {
  try {
    const { userIds, role } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "No user IDs provided" });
    }

    if (role !== "admin" && role !== "user") {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const currentUserId = req.user.id;
    const filteredIds = userIds.filter(
      (id) => id.toString() !== currentUserId.toString(),
    );

    const result = await User.updateMany(
      { _id: { $in: filteredIds } },
      { $set: { role } },
    );

    // 🔔 In-App Notification: Notify affected users
    filteredIds.forEach((uid) => {
      createNotification({
        userId: uid,
        type: "role_update",
        title: "Role Updated",
        message: `An administrator updated your role to '${role}'.`,
        metadata: { newRole: role },
      });
    });

    return res.status(200).json({
      message: `Role updated for ${result.modifiedCount} user(s)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUserGrowthAnalytics = async (req, res) => {
  try {
    const { timeframe = "30d" } = req.query;
    const now = new Date();
    let startDate = new Date();
    let isDaily = true;

    if (timeframe === "7d") {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      isDaily = true;
    } else if (timeframe === "30d" || timeframe === "this_month") {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      isDaily = true;
    } else if (timeframe === "6m") {
      startDate.setMonth(now.getMonth() - 5);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      isDaily = false;
    } else if (timeframe === "1y") {
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      isDaily = false;
    } else {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      isDaily = true;
    }

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const matchStage = {
      $or: [
        { createdAt: { $gte: startDate, $lte: endOfToday } },
        { createdAt: { $exists: false } },
      ],
    };

    const users = await User.find(matchStage).select("createdAt _id");
    const dataMap = {};

    users.forEach((u) => {
      let created = u.createdAt ? new Date(u.createdAt) : null;
      if (!created && u._id) {
        try {
          const timestamp =
            parseInt(u._id.toString().substring(0, 8), 16) * 1000;
          created = new Date(timestamp);
        } catch {
          created = null;
        }
      }
      if (created && created >= startDate && created <= endOfToday) {
        const yr = created.getFullYear();
        const mo = String(created.getMonth() + 1).padStart(2, "0");
        const da = String(created.getDate()).padStart(2, "0");
        const key = isDaily ? `${yr}-${mo}-${da}` : `${yr}-${mo}`;
        dataMap[key] = (dataMap[key] || 0) + 1;
      }
    });

    const timelineData = [];

    if (isDaily) {
      const iter = new Date(startDate);
      iter.setHours(0, 0, 0, 0);
      while (iter <= endOfToday) {
        const yr = iter.getFullYear();
        const mo = String(iter.getMonth() + 1).padStart(2, "0");
        const da = String(iter.getDate()).padStart(2, "0");
        const key = `${yr}-${mo}-${da}`;
        const label = iter.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        timelineData.push({
          date: key,
          label: label,
          count: dataMap[key] || 0,
        });
        iter.setDate(iter.getDate() + 1);
      }
    } else {
      const iter = new Date(startDate);
      iter.setDate(1);
      iter.setHours(0, 0, 0, 0);
      while (iter <= endOfToday) {
        const yr = iter.getFullYear();
        const mo = String(iter.getMonth() + 1).padStart(2, "0");
        const key = `${yr}-${mo}`;
        const label = iter.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        timelineData.push({
          date: key,
          label: label,
          count: dataMap[key] || 0,
        });
        iter.setMonth(iter.getMonth() + 1);
      }
    }

    const totalInWindow = timelineData.reduce(
      (acc, curr) => acc + curr.count,
      0,
    );
    const totalUsers = await User.countDocuments();

    return res.status(200).json({
      timeframe,
      totalInWindow,
      totalUsers,
      timeline: timelineData,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  // Legacy function names
  getUsers,
  deleteuser,
  updateuser,
  makeAdmin,
  getUserById,
  addUser,
  verifyEmail,

  getAdminUsers: getUsers,
  getAdminUserById: getUserById,
  createAdminUser: addUser,
  updateAdminUser: updateuser,
  deleteAdminUser: deleteuser,
  updateUserRole: makeAdmin,
  cancelPendingEmailChange,
  // Bulk Operations
  bulkDeleteUsers,
  bulkUpdateRole,
  // Analytics
  getUserGrowthAnalytics,
};
