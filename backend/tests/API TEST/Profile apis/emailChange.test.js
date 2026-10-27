jest.mock("../../../utils/sendEmail", () => jest.fn().mockResolvedValue(true));
jest.mock("../../../middleware/rateLimiter", () => ({
  authLimiter: (req, res, next) => next(),
  emailLimiter: (req, res, next) => next(),
  registerLimiter: (req, res, next) => next(),
  userApiLimiter: (req, res, next) => next(),
  globalLimiter: (req, res, next) => next(),
  notificationLimiter: (req, res, next) => next(),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  app,
  User,
  Session,
  ensureDb,
  makeUser,
  makeToken,
  cleanupUser,
} = require("./testUtils");

describe("Profile Email Change APIs - Request, OTP Verification, Resend, Cancel & Emergency Lock", () => {
  let user;
  let otherUser;
  let token;
  const userPassword = "Password123!";
  const testOtp = "123456";

  beforeAll(async () => {
    await ensureDb();

    const hashedPassword = await bcrypt.hash(userPassword, 10);

    user = await makeUser({
      name: "Email Change User",
      email: `email_change_${Date.now()}@example.com`,
      password: hashedPassword,
    });

    otherUser = await makeUser({
      name: "Existing Collision User",
      email: `existing_collision_${Date.now()}@example.com`,
      password: hashedPassword,
    });

    token = makeToken(user);
  });

  afterAll(async () => {
    await cleanupUser(user);
    await cleanupUser(otherUser);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("POST /profile/request-email-change", () => {
    test("TC_01: Missing newEmail par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/request-email-change")
        .set("Authorization", `Bearer ${token}`)
        .send({
          password: userPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("newEmail");
    });

    test("TC_02: Invalid newEmail format par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/request-email-change")
        .set("Authorization", `Bearer ${token}`)
        .send({
          newEmail: "invalid-email-address",
          password: userPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("newEmail");
    });

    test("TC_03: Missing current password par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/request-email-change")
        .set("Authorization", `Bearer ${token}`)
        .send({
          newEmail: "fresh_email_target@example.com",
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("password");
    });

    test("TC_04: New email current email ke barabar hone par 400 milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/request-email-change")
        .set("Authorization", `Bearer ${token}`)
        .send({
          newEmail: user.email,
          password: userPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "must be different from your current email",
      );
    });

    test("TC_05: Galat current password par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/request-email-change")
        .set("Authorization", `Bearer ${token}`)
        .send({
          newEmail: "fresh_email_target@example.com",
          password: "WrongPassword999!",
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("password");
      expect(res.body.message).toContain("Incorrect current password");
    });

    test("TC_06: Already registered email use karne par 409 Conflict aana chahiye", async () => {
      const res = await request(app)
        .post("/profile/request-email-change")
        .set("Authorization", `Bearer ${token}`)
        .send({
          newEmail: otherUser.email,
          password: userPassword,
        });

      expect(res.status).toBe(409);
      expect(res.body.field).toBe("newEmail");
      expect(res.body.message).toContain("already in use");
    });

    test("TC_07: Sahi data par 200 OK aur pendingEmail set hona chahiye", async () => {
      const newEmailTarget = `new_verified_${Date.now()}@example.com`;

      const res = await request(app)
        .post("/profile/request-email-change")
        .set("Authorization", `Bearer ${token}`)
        .send({
          newEmail: newEmailTarget,
          password: userPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pendingEmail).toBe(newEmailTarget);

      const inDb = await User.findById(user._id);
      expect(inDb.pendingEmail).toBe(newEmailTarget);
      expect(inDb.emailChangeOtp).toBeTruthy();
      expect(inDb.emergencyLockToken).toBeTruthy();
    });
  });

  describe("POST /profile/verify-email-otp", () => {
    test("TC_08: OTP format invalid (not 6 digits) par 400 milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/verify-email-otp")
        .set("Authorization", `Bearer ${token}`)
        .send({
          otp: "12",
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("otp");
      expect(res.body.message).toContain("valid 6-digit verification code");
    });
    test("TC_09: Galat OTP daalne par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/verify-email-otp")
        .set("Authorization", `Bearer ${token}`)
        .send({
          otp: "999999",
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("otp");
      expect(res.body.message).toContain("Invalid verification code");
    });

    test("TC_10: Expired OTP hone par 400 Bad Request aur isExpired: true milna chahiye", async () => {
      const hashedTestOtp = crypto
        .createHash("sha256")
        .update(testOtp)
        .digest("hex");
      user.emailChangeOtp = hashedTestOtp;
      user.emailChangeOtpExpire = new Date(Date.now() - 5000);
      await user.save();

      const res = await request(app)
        .post("/profile/verify-email-otp")
        .set("Authorization", `Bearer ${token}`)
        .send({
          otp: testOtp,
        });

      expect(res.status).toBe(400);
      expect(res.body.isExpired).toBe(true);
    });

    test("TC_11: Sahi OTP daalne par 200 OK, email update aur fresh token milna chahiye", async () => {
      const targetEmail = `target_final_${Date.now()}@example.com`;
      const hashedTestOtp = crypto
        .createHash("sha256")
        .update(testOtp)
        .digest("hex");

      user.pendingEmail = targetEmail;
      user.emailChangeOtp = hashedTestOtp;
      user.emailChangeOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const res = await request(app)
        .post("/profile/verify-email-otp")
        .set("Authorization", `Bearer ${token}`)
        .send({
          otp: testOtp,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe(targetEmail);

      const inDb = await User.findById(user._id);
      expect(inDb.email).toBe(targetEmail);
      expect(inDb.pendingEmail).toBeNull();
      expect(inDb.emailChangeOtp).toBeNull();

      user.email = targetEmail;
      user.pendingEmail = null;
      token = makeToken(user);
    });

    test("TC_12: Bina pending email change request ke OTP verify karne par 400 milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/verify-email-otp")
        .set("Authorization", `Bearer ${token}`)
        .send({
          otp: "123456",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "No pending email change request found",
      );
    });
  });

  describe("POST /profile/resend-email-otp", () => {
    test("TC_13: Bina pending email request ke resend par 400 milna chahiye", async () => {
      user.pendingEmail = null;
      await user.save();

      const res = await request(app)
        .post("/profile/resend-email-otp")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "No pending email change request found",
      );
    });

    test("TC_14: Pending email hone par naya OTP generate hokar 200 OK milna chahiye", async () => {
      user.pendingEmail = `pending_resend_${Date.now()}@example.com`;
      await user.save();

      const res = await request(app)
        .post("/profile/resend-email-otp")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pendingEmail).toBe(user.pendingEmail);

      const inDb = await User.findById(user._id);
      expect(inDb.emailChangeOtp).toBeTruthy();
    });
  });

  describe("DELETE /profile/cancel-email-change", () => {
    test("TC_15: Email change request cancel karne par pendingEmail saaf hona chahiye (200 OK)", async () => {
      const res = await request(app)
        .delete("/profile/cancel-email-change")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const inDb = await User.findById(user._id);
      expect(inDb.pendingEmail).toBeNull();
      expect(inDb.emailChangeOtp).toBeNull();
      expect(inDb.emergencyLockToken).toBeNull();
    });
  });

  describe("POST /profile/resend-pending-verification", () => {
    test("TC_16: Bina pending email ke verification link request karne par 400 milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/resend-pending-verification")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("No pending email change found");
    });

    test("TC_17: Pending email hone par verification link resend hokar 200 OK aana chahiye", async () => {
      user.pendingEmail = `pending_verify_link_${Date.now()}@example.com`;
      user.lastVerificationSentAt = null;
      await user.save();

      const res = await request(app)
        .post("/profile/resend-pending-verification")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain(
        "A new verification link has been sent to",
      );

      const inDb = await User.findById(user._id);
      expect(inDb.verificationToken).toBeTruthy();
    });
  });

  describe("GET /security/emergency-lock/:token", () => {
    test("TC_18: Invalid emergency token hone par expired error URL par redirect (302) hona chahiye", async () => {
      const fakeToken = "invalid-emergency-token-xyz";
      const res = await request(app).get(
        `/security/emergency-lock/${fakeToken}`,
      );

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("emergencyError=expired");
    });

    test("TC_19: Valid emergency token hone par account lock, password scramble aur reset URL par redirect hona chahiye", async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      user.emergencyLockToken = hashedToken;
      user.emergencyLockExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.pendingEmail = "attacker_email@example.com";
      await user.save();

      const res = await request(app).get(
        `/security/emergency-lock/${rawToken}`,
      );

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("/reset-password/");
      expect(res.headers.location).toContain("emergency=true");

      const lockedUser = await User.findById(user._id);
      expect(lockedUser.pendingEmail).toBeNull();
      expect(lockedUser.emergencyLockToken).toBeNull();
      expect(lockedUser.resetPasswordToken).toBeTruthy();
    });
  });
});
