const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../../server");
const User = require("../../../models/user");
const bcrypt = require("bcrypt");

jest.mock("../../utils/sendEmail", () => jest.fn().mockResolvedValue(true));

let testEmail = "test_login_user@gmail.com";
let testPassword = "Password123";

const allLoginEmails = [
  testEmail,
  "unverified_user_99@gmail.com",
  "pending_invite_user_99@gmail.com",
  "suspended_user_99@gmail.com",
  "banned_user_99@gmail.com",
  "wrong_pass_user_99@gmail.com",
  "lockout_trigger_user_99@gmail.com",
  "already_locked_user_99@gmail.com",
  "trusted_device_user_99@gmail.com",
  "new_device_user_99@gmail.com",
];

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  await User.deleteMany({ email: { $in: allLoginEmails } });

  const hashedPassword = await bcrypt.hash(testPassword, 10);
  await User.create({
    name: "Test Login User",
    email: testEmail,
    password: hashedPassword,
    role: "user",
    isVerified: true,
  });
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: allLoginEmails } });
  await mongoose.connection.close();
});

describe("POST /login - Login API Test Suite", () => {
  test("TC_01: Email missing hone par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/login").send({
      password: testPassword,
    });

    expect(res.statusCode).toBe(400);
  });

  test("TC_02: Galat password bhejne par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/login").send({
      email: testEmail,
      password: "WrongPassword999",
    });

    expect(res.statusCode).toBe(400);
  });

  test("TC_03: Unregistered email par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/login").send({
      email: "unregistered_random_user_99@gmail.com",
      password: testPassword,
    });

    expect(res.statusCode).toBe(400);
  });

  test("TC_04: Sahi credentials par 200 OK aur Successful Response milna chahiye", async () => {
    const res = await request(app).post("/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(200);

    if (res.body.requireOtp) {
      expect(res.body).toHaveProperty("requireOtp", true);
    } else {
      expect(res.body).toHaveProperty("token");
    }
  });

  test("TC_05: Missing password, expected 400 Bad Request", async () => {
    const res = await request(app).post("/login").send({
      email: testEmail,
    });

    expect(res.statusCode).toBe(400);
  });

  test("TC_06: Email syntax invalid, expected 400 Bad Request", async () => {
    const res = await request(app).post("/login").send({
      email: "invalid_email_format",
      password: testPassword,
    });
    expect(res.statusCode).toBe(400);
  });

  test("TC_07: Email not verified par 403 Forbidden milna chahiye", async () => {
    const unverifiedEmail = "unverified_user_99@gmail.com";
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    await User.create({
      name: "Unverified User",
      email: unverifiedEmail,
      password: hashedPassword,
      role: "user",
      isVerified: false,
    });

    const res = await request(app).post("/login").send({
      email: unverifiedEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.isUnverified).toBe(true);
    expect(res.body.message).toContain("verify your email address");

    await User.deleteOne({ email: unverifiedEmail });
  });

  test("TC_08: Admin-invited user, invite pending par 403 Forbidden milna chahiye", async () => {
    const pendingInviteEmail = "pending_invite_user_99@gmail.com";

    await User.create({
      name: "Pending Invite User",
      email: pendingInviteEmail,
      password: await bcrypt.hash(testPassword, 10),
      role: "user",
      isVerified: false,
      inviteStatus: "pending",
      dob: new Date("1990-01-01"),
    });

    const res = await request(app).post("/login").send({
      email: pendingInviteEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.isPendingInvite).toBe(true);
    expect(res.body.message).toContain("invitation is pending");

    await User.deleteOne({ email: pendingInviteEmail });
    
  });

  test("TC_09: Suspended user login try kare to 403 Forbidden milna chahiye", async () => {
    const suspendedEmail = "suspended_user_99@gmail.com";

    await User.create({
      name: "Suspended User",
      email: suspendedEmail,
      password: await bcrypt.hash(testPassword, 10),
      dob: new Date("1990-01-01"),
      isVerified: true,
      status: "suspended",
    });

    const res = await request(app).post("/login").send({
      email: suspendedEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.isSuspended).toBe(true);
    expect(res.body.message).toContain("suspended by administration");

    await User.deleteOne({ email: suspendedEmail });
  });

  test("TC_10: Banned user login try kare to 403 Forbidden milna chahiye", async () => {
    const bannedEmail = "banned_user_99@gmail.com";

    await User.create({
      name: "Banned User",
      email: bannedEmail,
      password: await bcrypt.hash(testPassword, 10),
      dob: new Date("1990-01-01"),
      isVerified: true,
      status: "banned",
    });

    const res = await request(app).post("/login").send({
      email: bannedEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.isBanned).toBe(true);
    expect(res.body.message).toContain("permanently banned");

    await User.deleteOne({ email: bannedEmail });
  });

  test("TC_11: Galat password par remaining attempts countdown warning milni chahiye", async () => {
    const wrongPassEmail = "wrong_pass_user_99@gmail.com";

    await User.create({
      name: "Wrong Pass User",
      email: wrongPassEmail,
      password: await bcrypt.hash(testPassword, 10),
      dob: new Date("1990-01-01"),
      isVerified: true,
      status: "active",
      loginAttempts: 0,
    });

    const res = await request(app).post("/login").send({
      email: wrongPassEmail,
      password: "IncorrectPassword123!",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.remainingAttempts).toBe(4);
    expect(res.body.message).toContain("4 attempt(s) left");

    await User.deleteOne({ email: wrongPassEmail });
  });

  test("TC_12: 5 baar galat password bhejne par 15 minute ke liye account lock hona chahiye (403)", async () => {
    const lockoutEmail = "lockout_trigger_user_99@gmail.com";

    await User.create({
      name: "Lockout Trigger User",
      email: lockoutEmail,
      password: await bcrypt.hash(testPassword, 10),
      dob: new Date("1990-01-01"),
      isVerified: true,
      status: "active",
      loginAttempts: 4,
    });

    const res = await request(app).post("/login").send({
      email: lockoutEmail,
      password: "WrongPassword5th!",
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.isLocked).toBe(true);
    expect(res.body.remainingMinutes).toBe(15);
    expect(res.body.message).toContain("locked for 15 minutes");

    await User.deleteOne({ email: lockoutEmail });
  });

  test("TC_13: Already locked user login try kare to 403 Forbidden aur remaining minutes milna chahiye", async () => {
    const alreadyLockedEmail = "already_locked_user_99@gmail.com";

    await User.create({
      name: "Already Locked User",
      email: alreadyLockedEmail,
      password: await bcrypt.hash(testPassword, 10),
      dob: new Date("1990-01-01"),
      isVerified: true,
      status: "active",
      lockUntil: new Date(Date.now() + 10 * 60 * 1000),
    });

    const res = await request(app).post("/login").send({
      email: alreadyLockedEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.isLocked).toBe(true);
    expect(res.body.remainingMinutes).toBe(10);
    expect(res.body.message).toContain("temporarily locked");

    await User.deleteOne({ email: alreadyLockedEmail });
  });

  test("TC_14: Trusted device se login karne par direct JWT token (200) milna chahiye", async () => {
    const trustedEmail = "trusted_device_user_99@gmail.com";
    const trustedDeviceId = "device_unit_test_trusted_001";

    await User.create({
      name: "Trusted Device User",
      email: trustedEmail,
      password: await bcrypt.hash(testPassword, 10),
      dob: new Date("1990-01-01"),
      isVerified: true,
      status: "active",
      trustedDevices: [
        {
          deviceId: trustedDeviceId,
          trustedAt: new Date(),
        },
      ],
    });

    const res = await request(app).post("/login").send({
      email: trustedEmail,
      password: testPassword,
      deviceId: trustedDeviceId,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("role", "user");
    expect(res.body.requireOtp).toBeFalsy();

    await User.deleteOne({ email: trustedEmail });
  });

  test("TC_15: New unrecognized device se login karne par requireOtp: true (200) milna chahiye", async () => {
    const newDeviceEmail = "new_device_user_99@gmail.com";

    await User.create({
      name: "New Device User",
      email: newDeviceEmail,
      password: await bcrypt.hash(testPassword, 10),
      dob: new Date("1990-01-01"),
      isVerified: true,
      status: "active",
      trustedDevices: [],
    });

    const res = await request(app).post("/login").send({
      email: newDeviceEmail,
      password: testPassword,
      deviceId: "completely_new_device_id_xyz",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.requireOtp).toBe(true);
    expect(res.body).toHaveProperty("message");

    await User.deleteOne({ email: newDeviceEmail });
  });
});
