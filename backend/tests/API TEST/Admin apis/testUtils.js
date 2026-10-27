const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../../server");
const User = require("../../../models/user");
const Session = require("../../../models/session");
const Notification = require("../../../models/notification");
const prefix = `admin_api_test_${process.pid}_${Date.now()}`;

async function ensureDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  } else if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
  }
}

function userData(overrides = {}) {
  return {
    name: "Admin API Test User",
    email: `${prefix}_${Math.random().toString(36).slice(2, 10)}@example.com`,
    password: "Test@123456",
    role: "user",
    status: "active",
    isVerified: true,
    gender: "male",
    dob: new Date("2000-01-01"),
    ...overrides,
  };
}

async function makeUser(overrides = {}) {
  return User.create(userData(overrides));
}

function makeToken(user) {
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

async function cleanupUser(user) {
  if (!user?._id) return;
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
  makeUser,
  makeToken,
  cleanupUser,
};
