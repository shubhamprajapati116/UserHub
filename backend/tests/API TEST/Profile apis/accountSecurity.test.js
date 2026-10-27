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
const path = require("path");
const fs = require("fs");
const {
  app,
  User,
  Session,
  Notification,
  ensureDb,
  makeUser,
  makeToken,
  cleanupUser,
} = require("./testUtils");

describe("Profile Account Security APIs - Change Password & Account Delete", () => {
  let user;
  let token;
  const oldPassword = "OldPassword123!";
  const newPassword = "NewStrongPassword456!";

  beforeAll(async () => {
    await ensureDb();

    const hashedPassword = await bcrypt.hash(oldPassword, 10);

    user = await makeUser({
      name: "Security Test User",
      email: `security_user_${Date.now()}@example.com`,
      password: hashedPassword,
    });

    token = makeToken(user);
  });

  afterAll(async () => {
    await cleanupUser(user);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("PUT /change-password", () => {
    test("TC_01: Token missing hone par 401 Unauthorized milna chahiye", async () => {
      const res = await request(app).put("/change-password").send({
        currentPassword: oldPassword,
        newPassword: newPassword,
      });

      expect(res.status).toBe(401);
    });

    test("TC_02: Current password missing hone par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .put("/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          newPassword: newPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("currentPassword");
      expect(res.body.message).toContain("Current password is required");
    });

    test("TC_03: New password missing hone par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .put("/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: oldPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("newPassword");
      expect(res.body.message).toContain("New password is required");
    });

    test("TC_04: New password 8 characters se chhota hone par 400 milna chahiye", async () => {
      const res = await request(app)
        .put("/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: oldPassword,
          newPassword: "short",
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("newPassword");
      expect(res.body.message).toContain(
        "Password must be at least 8 characters",
      );
    });

    test("TC_05: Current password galat daalne par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .put("/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "IncorrectCurrentPass!",
          newPassword: newPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("currentPassword");
      expect(res.body.message).toContain("Current password is incorrect");
    });

    test("TC_06: New password purane password ke barabar hone par 400 milna chahiye", async () => {
      const res = await request(app)
        .put("/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: oldPassword,
          newPassword: oldPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("newPassword");
      expect(res.body.message).toContain(
        "New password must be different from current password",
      );
    });

    test("TC_07: Sahi details ke sath password change hona chahiye (200 OK)", async () => {
      const res = await request(app)
        .put("/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: oldPassword,
          newPassword: newPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Password changed successfully");

      const inDb = await User.findById(user._id);
      const isNewMatch = await bcrypt.compare(newPassword, inDb.password);
      expect(isNewMatch).toBe(true);
    });
  });

  describe("DELETE /account-delete", () => {
    test("TC_08: Account delete request par user, photo, sessions aur notifications sab delete hone chahiye (200 OK)", async () => {
      const testPhotoName = `avatar-to-delete-${Date.now()}.png`;
      const uploadDir = path.join(__dirname, "../../../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const testPhotoPath = path.join(uploadDir, testPhotoName);
      fs.writeFileSync(testPhotoPath, "dummy image content");

      const delUser = await makeUser({
        name: "Delete Target User",
        email: `delete_me_${Date.now()}@example.com`,
        profilephoto: testPhotoName,
      });

      const delToken = makeToken(delUser);

      await Session.create({
        userId: delUser._id,
        sessionId: `session-${Date.now()}`,
        deviceId: `device-${Date.now()}`,
        browser: "Chrome",
        os: "Windows",
      });

      await Notification.create({
        userId: delUser._id,
        type: "welcome",
        title: "Welcome",
        message: "Hello",
      });

      const res = await request(app)
        .delete("/account-delete")
        .set("Authorization", `Bearer ${delToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Account Deleted");

      const userAfter = await User.findById(delUser._id);
      expect(userAfter).toBeNull();

      const sessionsAfter = await Session.find({ userId: delUser._id });
      expect(sessionsAfter.length).toBe(0);

      const notifsAfter = await Notification.find({ userId: delUser._id });
      expect(notifsAfter.length).toBe(0);

      expect(fs.existsSync(testPhotoPath)).toBe(false);
    });
  });
});
