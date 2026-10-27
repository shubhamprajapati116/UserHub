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
const jwt = require("jsonwebtoken");
const app = require("../../../server");
const User = require("../../../models/user");
const Session = require("../../../models/session");
const Notification = require("../../../models/notification");

describe("Notification APIs - In-App Alerts, Read State & Clear Operations", () => {
  let user1;
  let user2;
  let token1;
  let token2;
  let notif1Id;
  let notif2Id;
  let notifUser2Id;
  const currentSessionId = `session_${Date.now()}`;
  const currentDeviceId = `device_${Date.now()}`;

  function makeToken(user, sessionId) {
    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );
  }

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    } else if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise();
    }

    const testPrefix = `notif_test_${Date.now()}`;

    user1 = await User.create({
      name: "Notification User 1",
      email: `${testPrefix}_u1@example.com`,
      password: "Password123!",
      gender: "male",
      dob: new Date("1995-01-01"),
      role: "user",
      status: "active",
      isVerified: true,
    });

    user2 = await User.create({
      name: "Notification User 2",
      email: `${testPrefix}_u2@example.com`,
      password: "Password123!",
      gender: "female",
      dob: new Date("1996-02-02"),
      role: "user",
      status: "active",
      isVerified: true,
    });

    await Session.create({
      userId: user1._id,
      sessionId: currentSessionId,
      deviceId: currentDeviceId,
    });

    const user2SessionId = `session2_${Date.now()}`;
    await Session.create({
      userId: user2._id,
      sessionId: user2SessionId,
      deviceId: `device2_${Date.now()}`,
    });

    token1 = makeToken(user1, currentSessionId);
    token2 = makeToken(user2, user2SessionId);

    const n1 = await Notification.create({
      userId: user1._id,
      type: "welcome",
      title: "Welcome to UserHub",
      message: "Your account has been setup.",
      isRead: false,
    });
    notif1Id = n1._id.toString();

    const n2 = await Notification.create({
      userId: user1._id,
      type: "password_change",
      title: "Password Changed",
      message: "Your password was changed successfully.",
      isRead: false,
    });
    notif2Id = n2._id.toString();

    await Notification.create({
      userId: user1._id,
      type: "security_login",
      title: "Current Session Login Alert",
      message: "New login detected on current device",
      metadata: { sourceSessionId: currentSessionId },
      isRead: false,
    });

    await Notification.create({
      userId: user1._id,
      type: "security_login",
      title: "Current Device Login Alert",
      message: "New login detected on current device header",
      metadata: { sourceDeviceId: currentDeviceId },
      isRead: false,
    });

    const nUser2 = await Notification.create({
      userId: user2._id,
      type: "welcome",
      title: "User 2 Welcome",
      message: "Private notification for User 2",
      isRead: false,
    });
    notifUser2Id = nUser2._id.toString();
  });

  afterAll(async () => {
    await Session.deleteMany({ userId: { $in: [user1?._id, user2?._id] } });
    await Notification.deleteMany({
      userId: { $in: [user1?._id, user2?._id] },
    });
    await User.deleteMany({ _id: { $in: [user1?._id, user2?._id] } });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("GET /api/notifications", () => {
    test("TC_01: Missing token par 401 Unauthorized milna chahiye", async () => {
      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("No token provided");
    });

    test("TC_02: Malformed / invalid token par 401 Unauthorized milna chahiye", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", "Bearer invalid.token.xyz");

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid authentication token");
    });

    test("TC_03: Valid token par user ki notifications aur unreadCount milna chahiye (200 OK)", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.unreadCount).toBeGreaterThan(0);
    });

    test("TC_04: Current session ki security_login notifications filter (exclude) honi chahiye", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const sessionAlert = res.body.notifications.find(
        (n) => n.metadata?.sourceSessionId === currentSessionId,
      );
      expect(sessionAlert).toBeUndefined();
    });

    test("TC_05: Current device id (x-device-id header) ki security_login notifications filter honi chahiye", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token1}`)
        .set("x-device-id", currentDeviceId);

      expect(res.status).toBe(200);
      const deviceAlert = res.body.notifications.find(
        (n) => n.metadata?.sourceDeviceId === currentDeviceId,
      );
      expect(deviceAlert).toBeUndefined();
    });

    test("TC_06: Dusre user ki notifications response me nahi aani chahiye (Data Isolation)", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const hasUser2Notif = res.body.notifications.some(
        (n) => n._id === notifUser2Id,
      );
      expect(hasUser2Notif).toBe(false);
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    test("TC_07: Non-existent notification ID par 404 Not Found milna chahiye", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/notifications/${fakeId}/read`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Notification not found");
    });

    test("TC_08: Dusre user ki notification ko read karne par 404 milna chahiye", async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notifUser2Id}/read`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Notification not found");
    });

    test("TC_09: Valid notification ko markAsRead karne par 200 OK aur isRead: true milna chahiye", async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notif1Id}/read`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.notification.isRead).toBe(true);

      const inDb = await Notification.findById(notif1Id);
      expect(inDb.isRead).toBe(true);
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    test("TC_10: Sabhi unread notifications read mark hokar unreadCount 0 hona chahiye (200 OK)", async () => {
      const res = await request(app)
        .patch("/api/notifications/read-all")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBe(0);

      const remainingUnread = await Notification.countDocuments({
        userId: user1._id,
        type: { $ne: "security_login" },
        isRead: false,
      });
      expect(remainingUnread).toBe(0);
    });
  });

  describe("DELETE /api/notifications/:id", () => {
    test("TC_11: Non-existent notification ID delete karne par 404 milna chahiye", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Notification not found");
    });

    test("TC_12: Dusre user ki notification delete karne par 404 milna chahiye", async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notifUser2Id}`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Notification not found");
    });

    test("TC_13: Valid notification delete karne par 200 OK aur DB se remove hona chahiye", async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notif2Id}`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Notification deleted");

      const inDb = await Notification.findById(notif2Id);
      expect(inDb).toBeNull();
    });
  });

  describe("DELETE /api/notifications/clear-all", () => {
    test("TC_14: Sabhi notifications clear karne par 200 OK aur unreadCount 0 hona chahiye", async () => {
      const res = await request(app)
        .delete("/api/notifications/clear-all")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBe(0);

      const nonSessionCount = await Notification.countDocuments({
        userId: user1._id,
        type: { $ne: "security_login" },
      });
      expect(nonSessionCount).toBe(0);

      const user2Count = await Notification.countDocuments({
        userId: user2._id,
      });
      expect(user2Count).toBeGreaterThan(0);
    });
  });
});
