const User = require("../models/user");
const Session = require("../models/session");
const Notification = require("../models/notification");
const {
  userSchema,
  updateUserSchema,
  inviteUserSchema,
} = require("../validations/validate");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const createNotification = require("../utils/createNotification");
const emailTemplates = require("../utils/emailTemplates");
const { deleteFile, deleteMultipleFiles } = require("../utils/fileHelper");
const { validateEmailDeliverability } = require("../utils/emailValidator");

const addUser = async (req, res) => {
  try {
    const { error } = inviteUserSchema.validate(req.body);

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
      if (existingUser.inviteStatus === "pending") {
        return res.status(409).json({
          field: "email",
          isPendingInvite: true,
          message: `An invitation is already pending for ${normalizedEmail}. You can resend the invite or cancel it from the directory.`,
        });
      }
      return res.status(409).json({
        field: "email",
        message: "This email address is already registered.",
      });
    }

    const rawInviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenHash = crypto
      .createHash("sha256")
      .update(rawInviteToken)
      .digest("hex");
    const INVITE_EXPIRY_DAYS = 7;
    const inviteTokenExpire = new Date(
      Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const placeholderPassword = await bcrypt.hash(
      crypto.randomBytes(32).toString("hex"),
      10,
    );

    const adminId = req.user?.id || req.user?._id || null;

    const user = new User({
      name: req.body.name.trim(),
      email: normalizedEmail,
      password: placeholderPassword,
      gender: req.body.gender,
      dob: req.body.dob,
      profilephoto: req.file ? req.file.filename : "",
      role: "user",
      status: "active",
      isVerified: false,
      accountSource: "admin_invited",
      inviteStatus: "pending",
      invitedBy: adminId,
      invitedAt: new Date(),
      inviteTokenHash,
      inviteTokenExpire,
      lastInviteSentAt: new Date(),
    });

    await user.save();

    const acceptUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invite/${rawInviteToken}`;

    let adminName = "An Administrator";
    if (adminId) {
      const adminDoc = await User.findById(adminId).select("name");
      if (adminDoc?.name) adminName = adminDoc.name;
    }

    const expiresAtStr = inviteTokenExpire.toLocaleDateString("en-IN", {
      dateStyle: "medium",
    });

    let deliveryStatus = "sent";
    let deliveryError = "";

    try {
      await sendEmail(
        user.email,
        "You've Been Invited to UserHub - Set Up Your Account",
        emailTemplates.adminInvitationEmail({
          name: user.name,
          invitedByName: adminName,
          acceptUrl,
          expiresAtStr,
        }),
      );
      console.log(`✅ [Invite Dispatched]: Sent to ${user.email}`);
    } catch (mailErr) {
      deliveryStatus = "failed";
      deliveryError = mailErr.message || "Failed to deliver email";
      console.error(
        `❌ [Invite Dispatch Failed for ${user.email}]:`,
        mailErr.message,
      );
    }

    user.inviteDeliveryStatus = deliveryStatus;
    user.inviteDeliveryError = deliveryError;
    await user.save();

    return res.status(201).json({
      success: true,
      message:
        deliveryStatus === "sent"
          ? `Invitation sent successfully to ${user.email}! The user has 7 days to accept and set their password.`
          : `User created, but email delivery failed (${deliveryError}). You can retry sending from the user directory.`,
      deliveryStatus,
      inviteStatus: "pending",
      expiresAt: inviteTokenExpire,
      suggestion: deliverability.suggestion || null,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        inviteStatus: user.inviteStatus,
        inviteDeliveryStatus: user.inviteDeliveryStatus,
        inviteTokenExpire: user.inviteTokenExpire,
        invitedAt: user.invitedAt,
      },
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.filename);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const currentUserId = req.user?.id || req.user?._id;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const gender = req.query.gender || "";
    const country = req.query.country || "";
    const status = req.query.status || "";
    const timeframe = req.query.timeframe || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const query = {};

    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }

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
    } else if (verification === "pending_invite") {
      query.inviteStatus = "pending";
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

    if (timeframe) {
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "this_week":
          const firstDayOfWeek = new Date(now);
          firstDayOfWeek.setDate(now.getDate() - now.getDay());
          firstDayOfWeek.setHours(0, 0, 0, 0);
          startDate = firstDayOfWeek;
          break;
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "last_3_months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case "this_year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          break;
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const [
      totalUsers,
      totalCount,
      users,
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
      pendingInvitesCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments(query),
      User.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-password")
        .populate("invitedBy", "name email"),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      User.countDocuments({ gender: { $regex: /^male$/i } }),
      User.countDocuments({ gender: { $regex: /^female$/i } }),
      User.countDocuments({
        $or: [{ status: "active" }, { status: { $exists: false } }],
      }),
      User.countDocuments({ isVerified: false }),
      User.countDocuments({
        $or: [
          { phoneVerified: true },
          { "trustedDevices.0": { $exists: true } },
          { isVerified: true },
        ],
      }),
      User.countDocuments({ status: "suspended" }),
      User.countDocuments({ status: "banned" }),
      User.countDocuments({ inviteStatus: "pending" }),
    ]);

    const userIds = users.map((u) => u._id);
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    const [sessionCounts, recentActiveSessions] = await Promise.all([
      Session.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ]),
      Session.aggregate([
        {
          $match: {
            userId: { $in: userIds },
            lastActive: { $gte: fifteenMinsAgo },
          },
        },
        { $group: { _id: "$userId" } },
      ]),
    ]);

    const sessionCountMap = {};
    sessionCounts.forEach((sc) => {
      sessionCountMap[sc._id.toString()] = sc.count;
    });

    const onlineSet = new Set(
      recentActiveSessions.map((ras) => ras._id.toString()),
    );

    const enhancedUsers = users.map((u) => {
      const uObj = u.toObject();
      const uIdStr = u._id.toString();
      uObj.activeSessionCount = sessionCountMap[uIdStr] || 0;
      uObj.lastLogin = u.lastLogin || u.lastDeviceInfo?.lastLoginAt || null;
      uObj.isOnline =
        onlineSet.has(uIdStr) ||
        (uObj.lastLogin && new Date(uObj.lastLogin) >= fifteenMinsAgo);
      return uObj;
    });

    res.json({
      totalCount,
      totalInList: totalCount,
      users: enhancedUsers,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalUsers,
      systemTotalUsers: totalUsers,
      currentUserId,
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
        pendingInvitesCount,
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
      pendingInvitesCount,
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
      User.countDocuments({ ...query, inviteStatus: "pending" }),
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
        pendingInvitesCount,
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
        message:
          "You cannot delete your own administrator account from the user directory.",
      });
    }

    const targetUser = await User.findById(req.params.id).select(
      "profilephoto",
    );
    if (targetUser?.profilephoto) {
      deleteFile(targetUser.profilephoto);
    }

    await User.findByIdAndDelete(req.params.id);
    await Session.deleteMany({ userId: req.params.id }).catch(() => {});
    await Notification.deleteMany({ userId: req.params.id }).catch(() => {});
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
          message:
            "Email is already registered or pending with another account",
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

    const oldPhoto = previousUser.profilephoto;

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

    if (isEmailChanging && previousUser.inviteStatus === "pending") {
      const deliverability = await validateEmailDeliverability(requestedEmail);
      if (!deliverability.valid) {
        return res.status(400).json({
          field: "email",
          message: deliverability.reason,
          code: deliverability.code,
          suggestion: deliverability.suggestion,
        });
      }

      updateData.email = requestedEmail;
      updateData.pendingEmail = null;
      const rawInviteToken = crypto.randomBytes(32).toString("hex");
      updateData.inviteTokenHash = crypto
        .createHash("sha256")
        .update(rawInviteToken)
        .digest("hex");
      updateData.inviteTokenExpire = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );
      updateData.lastInviteSentAt = new Date();

      const acceptUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invite/${rawInviteToken}`;
      try {
        await sendEmail(
          requestedEmail,
          "You've Been Invited to UserHub - Set Up Your Account",
          emailTemplates.adminInvitationEmail({
            name: updateData.name || previousUser.name,
            invitedByName: "An Administrator",
            acceptUrl,
            expiresAtStr: updateData.inviteTokenExpire.toLocaleDateString(
              "en-IN",
              {
                dateStyle: "medium",
              },
            ),
          }),
        );
        updateData.inviteDeliveryStatus = "sent";
        updateData.inviteDeliveryError = "";
      } catch (err) {
        updateData.inviteDeliveryStatus = "failed";
        updateData.inviteDeliveryError =
          err.message || "Failed to deliver email";
      }
    } else if (isEmailChanging) {
      updateData.email = previousUser.email;
      updateData.pendingEmail = requestedEmail;
      const verificationToken = crypto.randomBytes(32).toString("hex");
      updateData.verificationToken = verificationToken;
      updateData.verificationTokenExpire = new Date(
        Date.now() + 72 * 60 * 60 * 1000,
      );
      updateData.lastVerificationSentAt = new Date();

      const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email/${verificationToken}`;

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
        console.log(
          `✅ [Admin Email Change]: Verification link sent to new email (${requestedEmail})`,
        );
      } catch (err) {
        console.error(
          "❌ [Admin Email Change Error]: Failed to send to new email:",
          err.message,
        );
      }

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
        console.log(
          `✅ [Admin Email Change]: Security alert sent to old email (${previousUser.email})`,
        );
      } catch (err) {
        console.error(
          "❌ [Admin Email Change Error]: Failed to send old email notice:",
          err.message,
        );
      }

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
      user,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.filename);
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

    if (!targetuser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (targetuser.inviteStatus === "pending") {
      return res.status(400).json({
        message:
          "Cannot promote an invited user who has not accepted their invitation yet.",
      });
    }

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

    const COOLDOWN_MS = 60 * 1000;
    if (
      user.lastVerificationSentAt &&
      Date.now() - new Date(user.lastVerificationSentAt).getTime() < COOLDOWN_MS
    ) {
      const remainingSec = Math.ceil(
        (COOLDOWN_MS -
          (Date.now() - new Date(user.lastVerificationSentAt).getTime())) /
          1000,
      );
      return res.status(429).json({
        message: `Please wait ${remainingSec}s before requesting a new verification link.`,
      });
    }

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
      console.log(
        `✅ [Resend Verification]: Link dispatched to ${user.pendingEmail}`,
      );
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

    const usersToDelete = await User.find({ _id: { $in: filteredIds } }).select(
      "profilephoto",
    );
    const photosToDelete = usersToDelete
      .map((u) => u.profilephoto)
      .filter(Boolean);
    deleteMultipleFiles(photosToDelete);

    const result = await User.deleteMany({ _id: { $in: filteredIds } });
    await Session.deleteMany({ userId: { $in: filteredIds } }).catch(() => {});
    await Notification.deleteMany({ userId: { $in: filteredIds } }).catch(
      () => {},
    );

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
    let startDate;
    let groupFormat;
    let daysCount = 30;

    let isMonthly = false;
    let monthsCount = 12;

    switch (timeframe) {
      case "7d":
        daysCount = 7;
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        groupFormat = "%Y-%m-%d";
        break;
      case "30d":
        daysCount = 30;
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        groupFormat = "%Y-%m-%d";
        break;
      case "90d":
        daysCount = 90;
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        groupFormat = "%Y-%m-%d";
        break;
      case "6m":
        isMonthly = true;
        monthsCount = 6;
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - (monthsCount - 1),
          1,
          0,
          0,
          0,
          0,
        );
        groupFormat = "%Y-%m";
        break;
      case "1y":
      case "12m":
        isMonthly = true;
        monthsCount = 12;
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - (monthsCount - 1),
          1,
          0,
          0,
          0,
          0,
        );
        groupFormat = "%Y-%m";
        break;
      default:
        daysCount = 30;
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        groupFormat = "%Y-%m-%d";
        break;
    }

    const previousStartDate = new Date(
      startDate.getTime() - (now.getTime() - startDate.getTime()),
    );

    const [timelineStats, previousPeriodUsers, totalUsers, previousUsersCount] =
      await Promise.all([
        User.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: now },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: groupFormat, date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        User.countDocuments({
          createdAt: { $gte: previousStartDate, $lt: startDate },
        }),
        User.countDocuments(),
        User.countDocuments({ createdAt: { $lt: startDate } }),
      ]);

    const timelineMap = {};
    timelineStats.forEach((item) => {
      timelineMap[item._id] = item.count;
    });

    const timelineData = [];

    if (isMonthly) {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const key = `${yyyy}-${mm}`;
        const label = `${monthNames[d.getMonth()]} ${String(yyyy).slice(2)}`;
        timelineData.push({
          date: key,
          label,
          count: timelineMap[key] || 0,
        });
      }
    } else {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;
        const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;
        timelineData.push({
          date: key,
          label,
          count: timelineMap[key] || 0,
        });
      }
    }

    const currentPeriodCount = timelineStats.reduce(
      (sum, item) => sum + item.count,
      0,
    );

    let growthRate = 0;
    if (previousPeriodUsers > 0) {
      growthRate = Number(
        (
          ((currentPeriodCount - previousPeriodUsers) / previousPeriodUsers) *
          100
        ).toFixed(1),
      );
    } else if (currentPeriodCount > 0) {
      growthRate = 100;
    }

    return res.status(200).json({
      timeframe,
      currentPeriodCount,
      previousPeriodCount: previousPeriodUsers,
      growthRate,
      totalUsers,
      previousUsersCount,
      timeline: timelineData,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const revokeUserSessions = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.inviteStatus === "pending") {
      return res.status(400).json({
        message:
          "This account has not accepted their invitation yet and has no active sessions.",
      });
    }

    const deleteResult = await Session.deleteMany({ userId: user._id });

    user.loginOtp = null;
    user.loginOtpExpire = null;
    user.trustedDevices = [];

    await user.save();

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

    const currentAdminId = req.user?.id || req.user?._id;
    if (currentAdminId && String(currentAdminId) === String(id)) {
      return res.status(400).json({
        message: "Administrators cannot suspend or ban their own accounts.",
      });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.inviteStatus === "pending") {
      return res.status(400).json({
        message:
          "Cannot change account status while invitation is pending. You can resend or cancel the invitation.",
      });
    }

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

    if (status === "suspended" || status === "banned") {
      await Session.deleteMany({ userId: user._id }).catch(() => {});
    }

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

const validateInviteEmail = async (req, res) => {
  try {
    const rawEmail = (req.body?.email || "").trim().toLowerCase();
    if (!rawEmail) {
      return res.status(400).json({
        valid: false,
        code: "EMPTY",
        reason: "Email address is required",
        suggestion: null,
      });
    }

    const deliverability = await validateEmailDeliverability(rawEmail);

    const existingUser = await User.findOne({
      $or: [{ email: rawEmail }, { pendingEmail: rawEmail }],
    });

    if (existingUser) {
      return res.status(200).json({
        valid: false,
        code: "ALREADY_EXISTS",
        reason:
          existingUser.inviteStatus === "pending"
            ? "An invitation is already pending for this email address."
            : "This email address is already registered.",
        suggestion: deliverability.suggestion,
        exists: true,
        isPendingInvite: existingUser.inviteStatus === "pending",
      });
    }

    return res.status(200).json({
      valid: deliverability.valid,
      code: deliverability.code,
      reason: deliverability.reason,
      suggestion: deliverability.suggestion,
      exists: false,
      isPendingInvite: false,
    });
  } catch (error) {
    return res.status(500).json({ valid: false, message: error.message });
  }
};

const resendInvite = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.inviteStatus !== "pending") {
      return res.status(400).json({
        message:
          "This account has already accepted their invitation or was self-registered.",
      });
    }

    const COOLDOWN_MS = 60 * 1000;
    if (
      user.lastInviteSentAt &&
      Date.now() - new Date(user.lastInviteSentAt).getTime() < COOLDOWN_MS
    ) {
      const remainingSec = Math.ceil(
        (COOLDOWN_MS -
          (Date.now() - new Date(user.lastInviteSentAt).getTime())) /
          1000,
      );
      return res.status(429).json({
        message: `Please wait ${remainingSec}s before sending another invitation.`,
      });
    }

    const rawInviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenHash = crypto
      .createHash("sha256")
      .update(rawInviteToken)
      .digest("hex");
    const INVITE_EXPIRY_DAYS = 7;
    const inviteTokenExpire = new Date(
      Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    user.inviteTokenHash = inviteTokenHash;
    user.inviteTokenExpire = inviteTokenExpire;
    user.lastInviteSentAt = new Date();

    const acceptUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invite/${rawInviteToken}`;

    const adminId = req.user?.id || req.user?._id || null;
    let adminName = "An Administrator";
    if (adminId) {
      const adminDoc = await User.findById(adminId).select("name");
      if (adminDoc?.name) adminName = adminDoc.name;
    }

    const expiresAtStr = inviteTokenExpire.toLocaleDateString("en-IN", {
      dateStyle: "medium",
    });

    let deliveryStatus = "sent";
    let deliveryError = "";

    try {
      await sendEmail(
        user.email,
        "Invitation to Join UserHub - Fresh Setup Link",
        emailTemplates.adminInvitationEmail({
          name: user.name,
          invitedByName: adminName,
          acceptUrl,
          expiresAtStr,
        }),
      );
      console.log(`✅ [Invite Resent]: Dispatched to ${user.email}`);
    } catch (mailErr) {
      deliveryStatus = "failed";
      deliveryError = mailErr.message || "Failed to deliver email";
      console.error(
        `❌ [Invite Resend Failed for ${user.email}]:`,
        mailErr.message,
      );
    }

    user.inviteDeliveryStatus = deliveryStatus;
    user.inviteDeliveryError = deliveryError;
    await user.save();

    return res.status(200).json({
      success: true,
      message:
        deliveryStatus === "sent"
          ? `Fresh invitation sent to ${user.email}! Valid for 7 days.`
          : `Email delivery failed (${deliveryError}). Check that the address is correct.`,
      deliveryStatus,
      expiresAt: inviteTokenExpire,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const cancelInvite = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.inviteStatus !== "pending") {
      return res.status(400).json({
        message:
          "Cannot cancel invitation: User has already accepted and activated their account.",
      });
    }

    if (user.profilephoto) {
      deleteFile(user.profilephoto);
    }

    const targetEmail = user.email;
    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      success: true,
      message: `Invitation for ${targetEmail} has been cancelled and removed.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addUser,
  getUsers,
  getAdminStats,
  deleteuser,
  updateuser,
  getUserById,
  makeAdmin,
  resendPendingEmailVerification,
  cancelPendingEmailChange,
  bulkDeleteUsers,
  bulkUpdateRole,
  getUserGrowthAnalytics,
  revokeUserSessions,
  updateUserStatus,
  validateInviteEmail,
  resendInvite,
  cancelInvite,

  getAdminUsers: getUsers,
  getAdminUserById: getUserById,
  createAdminUser: addUser,
  updateAdminUser: updateuser,
  deleteAdminUser: deleteuser,
  updateUserRole: makeAdmin,
};
