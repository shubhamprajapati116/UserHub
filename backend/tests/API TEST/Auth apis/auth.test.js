const request = require("supertest");
const mongoose = require("mongoose");
const crypto = require("crypto");
const app = require("../../../server");
const User = require("../../../models/user");
const bcrypt = require("bcrypt");

jest.mock("../../utils/sendEmail", () => jest.fn().mockResolvedValue(true));


const testPassword = "Password123!";

const allTestEmails = [
  "auth_check_email_test@gmail.com",
  "auth_existing_user@gmail.com",
  "auth_forgot_pass_user@gmail.com",
  "auth_reset_pass_user@gmail.com",
  "auth_otp_user@gmail.com",
  "auth_resend_otp_user@gmail.com",
  "auth_resend_verif_user@gmail.com",
  "auth_already_verified@gmail.com",
];

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  await User.deleteMany({ email: { $in: allTestEmails } });

  await User.create({
    name: "Existing Check Email User",
    email: "auth_existing_user@gmail.com",
    password: await bcrypt.hash(testPassword, 10),
    gender: "male",
    dob: new Date("1990-01-01"),
    isVerified: true,
  });

  await User.create({
    name: "Forgot Pass User",
    email: "auth_forgot_pass_user@gmail.com",
    password: await bcrypt.hash(testPassword, 10),
    gender: "female",
    dob: new Date("1992-05-10"),
    isVerified: true,
  });

  const resetToken = crypto.randomBytes(32).toString("hex");
  await User.create({
    name: "Reset Pass User",
    email: "auth_reset_pass_user@gmail.com",
    password: await bcrypt.hash(testPassword, 10),
    gender: "male",
    dob: new Date("1988-07-15"),
    isVerified: true,
    resetPasswordToken: resetToken,
    resetPasswordExpire: Date.now() + 15 * 60 * 1000,
  });

  global.validResetToken = resetToken;

  const otpRaw = "123456";
  const otpHash = crypto.createHash("sha256").update(otpRaw).digest("hex");
  await User.create({
    name: "OTP Test User",
    email: "auth_otp_user@gmail.com",
    password: await bcrypt.hash(testPassword, 10),
    gender: "male",
    dob: new Date("1995-03-20"),
    isVerified: true,
    loginOtp: otpHash,
    loginOtpExpire: new Date(Date.now() + 5 * 60 * 1000),
  });

  await User.create({
    name: "Resend OTP User",
    email: "auth_resend_otp_user@gmail.com",
    password: await bcrypt.hash(testPassword, 10),
    gender: "female",
    dob: new Date("1993-11-08"),
    isVerified: true,
  });

  await User.create({
    name: "Resend Verif User",
    email: "auth_resend_verif_user@gmail.com",
    password: await bcrypt.hash(testPassword, 10),
    gender: "male",
    dob: new Date("1991-06-25"),
    isVerified: false,
  });

  await User.create({
    name: "Already Verified User",
    email: "auth_already_verified@gmail.com",
    password: await bcrypt.hash(testPassword, 10),
    gender: "female",
    dob: new Date("1994-02-14"),
    isVerified: true,
  });
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: allTestEmails } });
  await mongoose.connection.close();
});

describe("POST /check-email - Email Availability Check", () => {
  test("TC_01: Email missing hone par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/check-email").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("email");
  });

  test("TC_02: Empty string email par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/check-email").send({ email: "   " });
    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("email");
  });

  test("TC_03: Already registered email par 409 Conflict milna chahiye", async () => {
    const res = await request(app)
      .post("/check-email")
      .send({ email: "auth_existing_user@gmail.com" });
    expect(res.statusCode).toBe(409);
    expect(res.body.available).toBe(false);
    expect(res.body.field).toBe("email");
  });

  test("TC_04: Fresh/available email par 200 aur available: true milna chahiye", async () => {
    const res = await request(app)
      .post("/check-email")
      .send({ email: "auth_check_email_test@gmail.com" });
    expect(res.statusCode).toBe(200);
    expect(res.body.available).toBe(true);
  });
});

describe("POST /forgot-password - Forgot Password API", () => {
  test("TC_01: Unregistered email par 400 Bad Request milna chahiye", async () => {
    const res = await request(app)
      .post("/forgot-password")
      .send({ email: "totally_random_nobody@gmail.com" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email not found");
  });

  test("TC_02: Valid registered email par 200 OK aur success message milna chahiye", async () => {
    const res = await request(app)
      .post("/forgot-password")
      .send({ email: "auth_existing_user@gmail.com" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("Password reset link sent");
  });

  test("TC_03: Pending invite user pe forgot-password try karne par 400 milna chahiye", async () => {
    const pendingEmail = "auth_pending_invite_forgot@gmail.com";
    await User.create({
      name: "Pending Invite Forgot",
      email: pendingEmail,
      password: await bcrypt.hash(testPassword, 10),
      gender: "male",
      dob: new Date("1990-01-01"),
      isVerified: false,
      inviteStatus: "pending",
    });

    const res = await request(app)
      .post("/forgot-password")
      .send({ email: pendingEmail });

    expect(res.statusCode).toBe(400);
    expect(res.body.isPendingInvite).toBe(true);

    await User.deleteOne({ email: pendingEmail });
  });
});

describe("GET /verify-reset-token/:token - Reset Token Verification", () => {
  test("TC_01: Invalid / random token par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).get(
      "/verify-reset-token/completely_invalid_token_xyz_12345",
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  test("TC_02: Expired token par 400 Bad Request milna chahiye", async () => {
    // Expired token wala user banana
    const expiredToken = crypto.randomBytes(32).toString("hex");
    const expiredEmail = "auth_expired_reset_token@gmail.com";
    await User.create({
      name: "Expired Token User",
      email: expiredEmail,
      password: await bcrypt.hash(testPassword, 10),
      gender: "male",
      dob: new Date("1990-01-01"),
      isVerified: true,
      resetPasswordToken: expiredToken,
      resetPasswordExpire: Date.now() - 1000,
    });

    const res = await request(app).get(`/verify-reset-token/${expiredToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.valid).toBe(false);

    await User.deleteOne({ email: expiredEmail });
  });

  test("TC_03: Valid aur unexpired token par 200 OK aur valid: true milna chahiye", async () => {
    const res = await request(app).get(
      `/verify-reset-token/${global.validResetToken}`,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});

describe("POST /reset-password/:token - Reset Password API", () => {
  test("TC_01: Invalid token se password reset karne par 400 Bad Request milna chahiye", async () => {
    const res = await request(app)
      .post("/reset-password/invalid_token_xyz_99")
      .send({ password: "NewPassword123!" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Invalid or expired token");
  });

  test("TC_02: Valid token aur naya password se 200 OK milna chahiye", async () => {
    const res = await request(app)
      .post(`/reset-password/${global.validResetToken}`)
      .send({ password: "NewPassword456!" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Password reset successfully");
  });
});

describe("POST /verify-login-otp - OTP Verification API", () => {
  test("TC_01: Email ya OTP missing hone par 400 Bad Request milna chahiye", async () => {
    const res = await request(app)
      .post("/verify-login-otp")
      .send({ email: "auth_otp_user@gmail.com" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Email and OTP are required");
  });

  test("TC_02: Unregistered email par 404 milna chahiye", async () => {
    const res = await request(app)
      .post("/verify-login-otp")
      .send({ email: "nobody_exists_here@gmail.com", otp: "123456" });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toContain("User not found");
  });

  test("TC_03: Galat OTP bhejne par 400 Bad Request milna chahiye", async () => {
    const res = await request(app)
      .post("/verify-login-otp")
      .send({ email: "auth_otp_user@gmail.com", otp: "999999" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Invalid OTP");
  });

  test("TC_04: Sahi OTP par 200 OK aur JWT token milna chahiye", async () => {
    const res = await request(app).post("/verify-login-otp").send({
      email: "auth_otp_user@gmail.com",
      otp: "123456",
      deviceId: "test_device_auth_001",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.message).toContain("Login successful");
  });
});

describe("POST /resend-login-otp - Resend OTP API", () => {
  test("TC_01: Unregistered email par 404 milna chahiye", async () => {
    const res = await request(app)
      .post("/resend-login-otp")
      .send({ email: "unregistered_random_resend@gmail.com" });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toContain("User not found");
  });

  test("TC_02: Valid email par 200 OK aur success message milna chahiye", async () => {
    const res = await request(app)
      .post("/resend-login-otp")
      .send({ email: "auth_resend_otp_user@gmail.com" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("new OTP has been sent");
  });

  test("TC_03: 60 second ke andar dobara OTP request karne par 429 Too Many Requests milna chahiye", async () => {
    await request(app)
      .post("/resend-login-otp")
      .send({ email: "auth_resend_otp_user@gmail.com" });

    const res = await request(app)
      .post("/resend-login-otp")
      .send({ email: "auth_resend_otp_user@gmail.com" });

    expect(res.statusCode).toBe(429);
    expect(res.body).toHaveProperty("remainingSeconds");
  });
});

describe("POST /resend-verification - Resend Verification Email API", () => {
  test("TC_01: Already verified user par 400 milna chahiye", async () => {
    const res = await request(app)
      .post("/resend-verification")
      .send({ email: "auth_already_verified@gmail.com" });
    expect(res.statusCode).toBe(400);
    expect(res.body.isAlreadyVerified).toBe(true);
    expect(res.body.message).toContain("already verified");
  });

  test("TC_02: Unverified user ke valid email par 200 OK milna chahiye", async () => {
    const res = await request(app)
      .post("/resend-verification")
      .send({ email: "auth_resend_verif_user@gmail.com" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("TC_03: Non-existent email par bhi 200 OK milna chahiye (security by design)", async () => {
    const res = await request(app)
      .post("/resend-verification")
      .send({ email: "absolutely_nobody@gmail.com" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("TC_04: 60 second ke andar dobara resend karne par 429 Too Many Requests milna chahiye", async () => {
    await request(app)
      .post("/resend-verification")
      .send({ email: "auth_resend_verif_user@gmail.com" });

    const res = await request(app)
      .post("/resend-verification")
      .send({ email: "auth_resend_verif_user@gmail.com" });

    expect(res.statusCode).toBe(429);
    expect(res.body).toHaveProperty("waitSeconds");
  });
});
