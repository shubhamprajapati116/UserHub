const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const app = require("../../../server");
const User = require("../../../models/user");
const Session = require("../../../models/session");
const Notification = require("../../../models/notification");
const prefix = `profile_test_${process.pid}_${Date.now()}`;

async function ensureDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  } else if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
  }
}

function userData(overrides = {}) {
  const uniqueStr = Math.random().toString(36).slice(2, 9);
  return {
    name: "Profile Test User",
    email: `${prefix}_${uniqueStr}@example.com`,
    password: "Password123!",
    gender: "male",
    dob: new Date("1995-05-15"),
    role: "user",
    status: "active",
    isVerified: true,
    ...overrides,
  };
}

async function makeUser(overrides = {}) {
  const data = userData(overrides);
  return User.create(data);
}

function makeToken(user, extra = {}) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      ...extra,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );
}

async function cleanupUser(user) {
  if (!user?._id) return;

  const dbUser = await User.findById(user._id).catch(() => null);
  const photoName = dbUser?.profilephoto || user.profilephoto;

  if (photoName) {
    const filePath = path.join(__dirname, "../../../uploads", photoName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
  }

  await Session.deleteMany({ userId: user._id }).catch(() => {});
  await Notification.deleteMany({ userId: user._id }).catch(() => {});
  await User.deleteOne({ _id: user._id }).catch(() => {});
}

module.exports = {
  app,
  User,
  Session,
  Notification,
  prefix,
  ensureDb,
  userData,
  makeUser,
  makeToken,
  cleanupUser,
};
