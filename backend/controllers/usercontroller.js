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
      status: "active",
      isVerified: true,
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
    const status = req.query.status || "";
    const timeframe = req.query.timeframe || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const query = {};

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

    const verification = req.query.verification || "";
    if (verification === "verified") {
      query.isVerified = true;
    } else if (verification === "unverified") {
      query.isVerified = false;
    }

    if (status === "active") {
      query.$or = [{ status: "active" }, { status: { $exists: false } }];
    } else if (status === "suspended" || status === "banned") {
      query.status = status;
    }

    if (gender) {
      query.gender = { $regex: gender, $options: "i" };
    }

    if (country) {
      query.country = { $regex: country, $options: "i" };
    }

    if (timeframe === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: d };
    } else if (timeframe === "7d") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: d };
    } else if (timeframe === "today") {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: d };
    } else if (timeframe === "90d") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      d.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: d };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // listQuery specifically excludes the logged-in user from the user directory table
    const listQuery = { ...query };
    if (currentUserId) {
      listQuery._id = { $ne: currentUserId };
    }

    const [
      users,
      totalInList,
      totalUsers,
      verifiedUsersCount,
      adminUsersCount,
      todayUsersCount,
      maleUsersCount,
      femaleUsersCount,
      activeUsersCount,
      unverifiedUsersCount,
      securityVerifiedCount,
      suspendedUsersCount,
      bannedUsersCount,
    ] = await Promise.all([
      User.find(listQuery)
        .select(
          "-password -resetPasswordToken -resetPasswordExpire -verificationToken",
        )
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(listQuery),
      User.countDocuments(query),
      User.countDocuments({ ...query, isVerified: true }),
      User.countDocuments({ ...query, role: "admin" }),
      User.countDocuments({
        ...query,
        createdAt: { $gte: startOfToday, $lte: endOfToday },
      }),
      User.countDocuments({ ...query, gender: { $regex: /^male$/i } }),
      User.countDocuments({ ...query, gender: { $regex: /^female$/i } }),
      User.countDocuments({
        ...query,
        $or: [{ status: "active" }, { status: { $exists: false } }],
      }),
      User.countDocuments({ ...query, isVerified: false }),
      User.countDocuments({
        ...query,
        $or: [
          { phoneVerified: true },
          { "trustedDevices.0": { $exists: true } },
          { isVerified: true },
        ],
      }),
      User.countDocuments({ ...query, status: "suspended" }),
      User.countDocuments({ ...query, status: "banned" }),
    ]);
    res.json({
      users,
      totalUsers,
      totalInList,
      systemTotalUsers: totalUsers,
      stats: {
        totalUsers,
        totalInList,
        verifiedUsersCount,
        adminUsersCount,
        todayUsersCount,
        maleUsersCount,
        femaleUsersCount,
        activeUsersCount,
        unverifiedUsersCount,
        securityVerifiedCount,
        suspendedUsersCount,
        bannedUsersCount,
        otherUsersCount: Math.max(
          0,
          totalUsers - (maleUsersCount + femaleUsersCount),
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const query = {};

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalUsers,
      verifiedUsersCount,
      adminUsersCount,
      todayUsersCount,
      maleUsersCount,
      femaleUsersCount,
      activeUsersCount,
      unverifiedUsersCount,
      securityVerifiedCount,
      suspendedUsersCount,
      bannedUsersCount,
    ] = await Promise.all([
      User.countDocuments(query),
      User.countDocuments({ ...query, isVerified: true }),
      User.countDocuments({ ...query, role: "admin" }),
      User.countDocuments({
        ...query,
        createdAt: { $gte: startOfToday, $lte: endOfToday },
      }),
      User.countDocuments({ ...query, gender: { $regex: /^male$/i } }),
      User.countDocuments({ ...query, gender: { $regex: /^female$/i } }),
      User.countDocuments({
        ...query,
        $or: [{ status: "active" }, { status: { $exists: false } }],
      }),
      User.countDocuments({ ...query, isVerified: false }),
      User.countDocuments({
        ...query,
        $or: [
          { phoneVerified: true },
          { "trustedDevices.0": { $exists: true } },
          { isVerified: true },
        ],
      }),
      User.countDocuments({ ...query, status: "suspended" }),
      User.countDocuments({ ...query, status: "banned" }),
    ]);

    res.json({
      totalUsers,
      stats: {
        totalUsers,
        verifiedUsersCount,
        adminUsersCount,
        todayUsersCount,
        maleUsersCount,
        femaleUsersCount,
        activeUsersCount,
        unverifiedUsersCount,
        securityVerifiedCount,
        suspendedUsersCount,
        bannedUsersCount,
        otherUsersCount: Math.max(
          0,
          totalUsers - (maleUsersCount + femaleUsersCount),
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteuser = async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;
    if (currentUserId && String(currentUserId) === String(req.params.id)) {
      return res.status(400).json({
        message: "You cannot delete your own administrator account from the user directory.",
      });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({
      message: "user deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

    const requestedEmail = req.body.email?.toLowerCase().trim();
    if (requestedEmail) {
      const existingUser = await User.findOne({
        $or: [{ email: requestedEmail }, { pendingEmail: requestedEmail }],
        _id: { $ne: req.params.id },
      });

      if (existingUser) {
        return res.status(409).json({
          field: "email",
          message: "Email is already registered or pending with another account",
        });
      }
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

    const isEmailChanging =
      requestedEmail &&
      requestedEmail !== previousUser.email?.toLowerCase().trim();

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
      updateData.verificationTokenExpire = new Date(
        Date.now() + 72 * 60 * 60 * 1000,
      ); // 72 hours
      updateData.lastVerificationSentAt = new Date();

      const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email/${verificationToken}`;

      // 1. 📧 Send Confirmation Link to the NEW email
      try {
        await sendEmail(
          requestedEmail,
          "Confirm Your New Email Address - UserHub",
          emailTemplates.adminEmailChangePendingVerificationEmail({
            name: previousUser.name || "User",
            oldEmail: previousUser.email,
            newEmail: requestedEmail,
            verifyUrl,
          }),
        );
        console.log(`✅ [Admin Email Change]: Verification link sent to new email (${requestedEmail})`);
      } catch (err) {
        console.error(
          "❌ [Admin Email Change Error]: Failed to send to new email:",
          err.message,
        );
      }

      // 2. 📢 Send Security Alert to the OLD email
      try {
        await sendEmail(
          previousUser.email,
          "[Security Notice] Email change requested for your UserHub account",
          emailTemplates.oldEmailChangeNoticeTemplate({
            name: previousUser.name || "User",
            oldEmail: previousUser.email,
            newEmail: requestedEmail,
            changedBy: "an Administrator",
          }),
        );
        console.log(`✅ [Admin Email Change]: Security alert sent to old email (${previousUser.email})`);
      } catch (err) {
        console.error("❌ [Admin Email Change Error]: Failed to send old email notice:", err.message);
      }

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

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        message: "Invalid verification link. Please request a new one.",
      });
    }

    // ── Check if token has expired ──
    if (
      user.verificationTokenExpire &&
      user.verificationTokenExpire < new Date()
    ) {
      return res.status(410).json({
        message:
          "This verification link has expired (valid for 72 hours).",
        isExpired: true,
        hasPendingEmail: !!user.pendingEmail,
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

      // 🛡️ Security: Invalidate previous sessions so user logs in with new verified credentials
      await Session.deleteMany({ userId: user._id }).catch(() => {});
    }

    user.isVerified = true;
    if (!user.status) {
      user.status = "active";
    }
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    if (isPendingEmailUpdate) {
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
    return res.status(500).json({ message: error.message });
  }
};

// User or Admin can resend pending email verification link
const resendPendingEmailVerification = async (req, res) => {
  try {
    const targetUserId = req.params.id || req.user.id;
    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.pendingEmail) {
      return res.status(400).json({
        message:
          "No pending email change found for this user. Email is already up to date.",
      });
    }

    // Cooldown: 60 seconds between resends
    const COOLDOWN_MS = 60 * 1000;
    if (
      user.lastVerificationSentAt &&
      Date.now() - new Date(user.lastVerificationSentAt).getTime() < COOLDOWN_MS
    ) {
      const remainingSec = Math.ceil(
        (COOLDOWN_MS - (Date.now() - new Date(user.lastVerificationSentAt).getTime())) / 1000,
      );
      return res.status(429).json({
        message: `Please wait ${remainingSec}s before requesting a new verification link.`,
      });
    }

    // Generate fresh token
    const newToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = newToken;
    user.verificationTokenExpire = new Date(Date.now() + 72 * 60 * 60 * 1000);
    user.lastVerificationSentAt = new Date();
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email/${newToken}`;

    try {
      await sendEmail(
        user.pendingEmail,
        "Confirm Your New Email Address - UserHub",
        emailTemplates.adminEmailChangePendingVerificationEmail({
          name: user.name || "User",
          oldEmail: user.email,
          newEmail: user.pendingEmail,
          verifyUrl,
        }),
      );
      console.log(`✅ [Resend Verification]: Link dispatched to ${user.pendingEmail}`);
    } catch (err) {
      console.error("❌ [Resend Verification Error]:", err.message);
    }

    return res.status(200).json({
      message: `A new verification link has been sent to ${user.pendingEmail}. It will expire in 72 hours.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const cancelPendingEmailChange = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({
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
    let mode = "daily"; // "hourly", "daily", "monthly"

    if (timeframe === "day" || timeframe === "1d" || timeframe === "24h") {
      startDate.setHours(0, 0, 0, 0);
      mode = "hourly";
    } else if (timeframe === "7d" || timeframe === "week") {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      mode = "daily";
    } else if (
      timeframe === "30d" ||
      timeframe === "month" ||
      timeframe === "this_month"
    ) {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      mode = "daily";
    } else if (timeframe === "6m") {
      startDate.setMonth(now.getMonth() - 5);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      mode = "monthly";
    } else if (timeframe === "1y") {
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      mode = "monthly";
    } else {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      mode = "daily";
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
        const hr = String(created.getHours()).padStart(2, "0");

        let key = `${yr}-${mo}-${da}`;
        if (mode === "hourly") {
          key = `${yr}-${mo}-${da}-${hr}`;
        } else if (mode === "monthly") {
          key = `${yr}-${mo}`;
        }
        dataMap[key] = (dataMap[key] || 0) + 1;
      }
    });

    const timelineData = [];

    if (mode === "hourly") {
      // 8 time intervals for today: 12 AM, 3 AM, 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM
      for (let h = 0; h < 24; h += 3) {
        const hrStr = String(h).padStart(2, "0");
        const yr = now.getFullYear();
        const mo = String(now.getMonth() + 1).padStart(2, "0");
        const da = String(now.getDate()).padStart(2, "0");
        const key = `${yr}-${mo}-${da}-${hrStr}`;

        const period = h >= 12 ? "PM" : "AM";
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        const label = `${displayHour} ${period}`;

        let windowCount = 0;
        for (let sub = 0; sub < 3; sub++) {
          const subHr = String(h + sub).padStart(2, "0");
          const subKey = `${yr}-${mo}-${da}-${subHr}`;
          windowCount += dataMap[subKey] || 0;
        }

        timelineData.push({
          date: key,
          label: label,
          count: windowCount,
        });
      }
    } else if (mode === "daily") {
      const iter = new Date(startDate);
      iter.setHours(0, 0, 0, 0);
      while (iter <= endOfToday) {
        const yr = iter.getFullYear();
        const mo = String(iter.getMonth() + 1).padStart(2, "0");
        const da = String(iter.getDate()).padStart(2, "0");
        const key = `${yr}-${mo}-${da}`;

        let label = iter.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (timeframe === "7d" || timeframe === "week") {
          label = iter.toLocaleDateString("en-US", {
            weekday: "short",
          });
        }

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
    const previousUsersCount = Math.max(0, totalUsers - totalInWindow);

    return res.status(200).json({
      timeframe,
      totalInWindow,
      totalUsers,
      previousUsersCount,
      timeline: timelineData,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ── Revoke User Sessions (Admin Force Logout / Kick to Login) ──
const revokeUserSessions = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Terminate all active sessions for this user from Session collection
    const deleteResult = await Session.deleteMany({ userId: user._id });

    // 2. Clear login OTP and trusted devices for security re-authentication
    user.loginOtp = null;
    user.loginOtpExpire = null;
    user.trustedDevices = [];

    await user.save();

    // 3. 📧 Send Security Alert Email (ZERO expiring links - informs user that sessions were revoked)
    const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
    sendEmail(
      user.email,
      "Security Alert: Active Sessions Revoked - UserHub",
      emailTemplates.sessionRevocationAlertEmail({
        name: user.name,
        loginUrl,
        sessionCount: deleteResult.deletedCount || 0,
      }),
    ).catch((err) =>
      console.error(
        "Error sending session revocation alert email:",
        err.message,
      ),
    );

    // 4. Send in-app security alert notification
    await createNotification({
      userId: user._id,
      type: "security_alert",
      title: "Session Revoked by Administrator",
      message:
        "An administrator has revoked your active sessions. You have been logged out of all connected devices.",
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `User sessions revoked (${deleteResult.deletedCount || 0} session(s) closed). Security alert email sent to ${user.email}.`,
      terminatedCount: deleteResult.deletedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ── Admin: Update User Account Status (active | suspended | banned) ──
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const allowedStatuses = ["active", "suspended", "banned"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    // Safety: Admin cannot suspend or ban themselves
    const currentAdminId = req.user?.id || req.user?._id;
    if (currentAdminId && String(currentAdminId) === String(id)) {
      return res.status(400).json({
        message: "Administrators cannot suspend or ban their own accounts.",
      });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Safety: Do not allow suspending another admin directly
    if (
      user.role === "admin" &&
      (status === "suspended" || status === "banned")
    ) {
      return res.status(403).json({
        message:
          "Cannot suspend or ban an administrator. Demote them to user first.",
      });
    }

    user.status = status;
    user.statusReason = reason || "";
    user.statusUpdatedAt = new Date();
    await user.save();

    // Invalidate sessions immediately if suspended or banned
    if (status === "suspended" || status === "banned") {
      await Session.deleteMany({ userId: user._id }).catch(() => {});
    }

    // Notification
    let notifTitle = "Account Status Updated";
    let notifMsg = `Your account status has been updated to ${status}.`;
    if (status === "suspended") {
      notifTitle = "Account Suspended";
      notifMsg =
        "Your account has been suspended by administration. Contact support.";
    } else if (status === "banned") {
      notifTitle = "Account Permanently Banned";
      notifMsg = "Your account has been permanently banned by administration.";
    } else if (status === "active") {
      notifTitle = "Account Reactivated";
      notifMsg = "Your account has been reactivated. You now have full access.";
    }

    await createNotification({
      userId: user._id,
      type: "security_alert",
      title: notifTitle,
      message: notifMsg,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message:
        status === "active"
          ? "User account has been reactivated successfully."
          : `User account has been ${status} successfully.`,
      user: {
        _id: user._id,
        status: user.status,
        statusReason: user.statusReason,
        statusUpdatedAt: user.statusUpdatedAt,
      },
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
  resendPendingEmailVerification,
  revokeUserSessions,
  // Bulk Operations
  bulkDeleteUsers,
  bulkUpdateRole,
  // Analytics
  getUserGrowthAnalytics,
  getAdminStats,
  updateUserStatus,
};
