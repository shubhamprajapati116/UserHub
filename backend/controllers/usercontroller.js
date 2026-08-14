const User = require("../models/user");
const { userSchema, updateUserSchema } = require("../validations/validate");
const bcrypt = require("bcrypt");
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

    // console.log("Users fetched:", users);
    // console.log("Total users count:", totalUsers);
    // console.log("Verified users count:", verifiedUsersCount);
    // console.log("Admin users count:", adminUsersCount);
    // console.log("Today's users count:", todayUsersCount);

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

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User Updated Successfully",
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

    return res.status(200).json(user);
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
        message: "Invalid verification token",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;

    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
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

    return res.status(200).json({
      message: `Role updated for ${result.modifiedCount} user(s)`,
      modifiedCount: result.modifiedCount,
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

  // Refactored Admin Controller Aliases
  getAdminUsers: getUsers,
  getAdminUserById: getUserById,
  createAdminUser: addUser,
  updateAdminUser: updateuser,
  deleteAdminUser: deleteuser,
  updateUserRole: makeAdmin,

  // Bulk Operations
  bulkDeleteUsers,
  bulkUpdateRole,
};
