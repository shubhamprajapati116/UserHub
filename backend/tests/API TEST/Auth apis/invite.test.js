const request = require("supertest");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const app = require("../../../server");
const User = require("../../../models/user");

jest.mock("../../utils/sendEmail", () => jest.fn().mockResolvedValue(true));

const testPassword = "Password123!";

const allTestEmails = [
  "invite_test_verify_email@example.com",
  "invite_test_expired_verify@example.com",
  "invite_test_valid_invite@example.com",
  "invite_test_expired_invite@example.com",
  "invite_test_accept_user@example.com",
  "invite_test_api_accept_user@example.com",
  "invite_test_inviter_admin@example.com",
];

let validVerifyToken;
let expiredVerifyToken;

let validInviteRawToken;
let expiredInviteRawToken;
let acceptInviteRawToken;
let apiAcceptInviteRawToken;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  } else if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
  }

  await User.deleteMany({ email: { $in: allTestEmails } });

  const admin = await User.create({
    name: "Invite Admin",
    email: "invite_test_inviter_admin@example.com",
    password: await bcrypt.hash(testPassword, 10),
    role: "admin",
    status: "active",
    isVerified: true,
  });

  validVerifyToken = crypto.randomBytes(32).toString("hex");
  await User.create({
    name: "Valid Verify User",
    email: "invite_test_verify_email@example.com",
    password: await bcrypt.hash(testPassword, 10),
    role: "user",
    status: "active",
    isVerified: false,
    verificationToken: validVerifyToken,
    verificationTokenExpire: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  expiredVerifyToken = crypto.randomBytes(32).toString("hex");
  await User.create({
    name: "Expired Verify User",
    email: "invite_test_expired_verify@example.com",
    password: await bcrypt.hash(testPassword, 10),
    role: "user",
    status: "active",
    isVerified: false,
    verificationToken: expiredVerifyToken,
    verificationTokenExpire: new Date(Date.now() - 1000),
  });

  validInviteRawToken = crypto.randomBytes(32).toString("hex");
  const validInviteHash = crypto
    .createHash("sha256")
    .update(validInviteRawToken)
    .digest("hex");

  await User.create({
    name: "Valid Invite User",
    email: "invite_test_valid_invite@example.com",
    password: await bcrypt.hash(testPassword, 10),
    role: "user",
    status: "active",
    isVerified: false,
    accountSource: "admin_invited",
    inviteStatus: "pending",
    invitedBy: admin._id,
    inviteTokenHash: validInviteHash,
    inviteTokenExpire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  expiredInviteRawToken = crypto.randomBytes(32).toString("hex");
  const expiredInviteHash = crypto
    .createHash("sha256")
    .update(expiredInviteRawToken)
    .digest("hex");

  await User.create({
    name: "Expired Invite User",
    email: "invite_test_expired_invite@example.com",
    password: await bcrypt.hash(testPassword, 10),
    role: "user",
    status: "active",
    isVerified: false,
    accountSource: "admin_invited",
    inviteStatus: "pending",
    invitedBy: admin._id,
    inviteTokenHash: expiredInviteHash,
    inviteTokenExpire: new Date(Date.now() - 1000),
  });

  acceptInviteRawToken = crypto.randomBytes(32).toString("hex");
  const acceptInviteHash = crypto
    .createHash("sha256")
    .update(acceptInviteRawToken)
    .digest("hex");

  await User.create({
    name: "Accept Invite User",
    email: "invite_test_accept_user@example.com",
    password: await bcrypt.hash(testPassword, 10),
    role: "user",
    status: "active",
    isVerified: false,
    accountSource: "admin_invited",
    inviteStatus: "pending",
    invitedBy: admin._id,
    inviteTokenHash: acceptInviteHash,
    inviteTokenExpire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  apiAcceptInviteRawToken = crypto.randomBytes(32).toString("hex");
  const apiAcceptInviteHash = crypto
    .createHash("sha256")
    .update(apiAcceptInviteRawToken)
    .digest("hex");

  await User.create({
    name: "API Accept User",
    email: "invite_test_api_accept_user@example.com",
    password: await bcrypt.hash(testPassword, 10),
    role: "user",
    status: "active",
    isVerified: false,
    accountSource: "admin_invited",
    inviteStatus: "pending",
    invitedBy: admin._id,
    inviteTokenHash: apiAcceptInviteHash,
    inviteTokenExpire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: allTestEmails } });
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe("GET /verify-email/:token - Email Verification API", () => {
  test("TC_01: Invalid token hone par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).get(
      "/verify-email/completely_invalid_token_99",
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Invalid verification link");
  });

  test("TC_02: Expired token hone par 410 Gone milna chahiye", async () => {
    const res = await request(app).get(`/verify-email/${expiredVerifyToken}`);
    expect(res.statusCode).toBe(410);
    expect(res.body.isExpired).toBe(true);
    expect(res.body.message).toContain("expired");
  });

  test("TC_03: Valid token hone par 200 OK aur user verify hona chahiye", async () => {
    const res = await request(app).get(`/verify-email/${validVerifyToken}`);
    expect(res.statusCode).toBe(200);

    const verifiedUser = await User.findOne({
      email: "invite_test_verify_email@example.com",
    });
    expect(verifiedUser.isVerified).toBe(true);
    expect(verifiedUser.verificationToken).toBeUndefined();
  });
});

describe("GET /invite/:token & /api/invite/:token - Invitation Details API", () => {
  test("TC_04: Invalid / non-existent invite token par 404 Not Found milna chahiye", async () => {
    const res = await request(app).get("/invite/random_non_existent_token_123");
    expect(res.statusCode).toBe(404);
    expect(res.body.valid).toBe(false);
  });

  test("TC_05: Expired invite token par 410 Gone milna chahiye", async () => {
    const res = await request(app).get(`/invite/${expiredInviteRawToken}`);
    expect(res.statusCode).toBe(410);
    expect(res.body.valid).toBe(false);
    expect(res.body.isExpired).toBe(true);
  });

  test("TC_06: Valid invite token par 200 OK aur user details milna chahiye", async () => {
    const res = await request(app).get(`/invite/${validInviteRawToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.name).toBe("Valid Invite User");
    expect(res.body.email).toBe("invite_test_valid_invite@example.com");
    expect(res.body.invitedByName).toBe("Invite Admin");
    expect(res.body).toHaveProperty("expiresAt");
  });

  test("TC_07: Alias /api/invite/:token par bhi same valid details milna chahiye", async () => {
    const res = await request(app).get(`/api/invite/${validInviteRawToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.email).toBe("invite_test_valid_invite@example.com");
  });
});

describe("POST /invite/:token/accept - Accept Invite API", () => {
  test("TC_08: Password missing ya short (< 8 chars) hone par 400 Bad Request milna chahiye", async () => {
    const res = await request(app)
      .post(`/invite/${acceptInviteRawToken}/accept`)
      .send({ password: "123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("password");
  });

  test("TC_09: Confirm password mismatch hone par 400 Bad Request milna chahiye", async () => {
    const res = await request(app)
      .post(`/invite/${acceptInviteRawToken}/accept`)
      .send({
        password: "NewPassword123!",
        confirmPassword: "DifferentPassword999!",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("confirmPassword");
  });

  test("TC_10: Invalid invite token par 404 Not Found milna chahiye", async () => {
    const res = await request(app)
      .post("/invite/completely_invalid_invite_token_xyz/accept")
      .send({
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      });

    expect(res.statusCode).toBe(404);
  });

  test("TC_11: Expired invite token par 410 Gone milna chahiye", async () => {
    const res = await request(app)
      .post(`/invite/${expiredInviteRawToken}/accept`)
      .send({
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      });

    expect(res.statusCode).toBe(410);
    expect(res.body.isExpired).toBe(true);
  });

  test("TC_12: Valid token aur password par 200 OK milna chahiye aur account activate hona chahiye", async () => {
    const res = await request(app)
      .post(`/invite/${acceptInviteRawToken}/accept`)
      .send({
        password: "ActivatedPassword123!",
        confirmPassword: "ActivatedPassword123!",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("accepted");

    const user = await User.findOne({
      email: "invite_test_accept_user@example.com",
    });
    expect(user.inviteStatus).toBe("accepted");
    expect(user.isVerified).toBe(true);
    expect(user.status).toBe("active");
  });

  test("TC_13: Alias /api/invite/:token/accept par bhi successfully accept hona chahiye", async () => {
    const res = await request(app)
      .post(`/api/invite/${apiAcceptInviteRawToken}/accept`)
      .send({
        password: "ActivatedApiPassword123!",
        confirmPassword: "ActivatedApiPassword123!",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await User.findOne({
      email: "invite_test_api_accept_user@example.com",
    });
    expect(user.inviteStatus).toBe("accepted");
    expect(user.isVerified).toBe(true);
  });
});
