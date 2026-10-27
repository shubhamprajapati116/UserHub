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

describe("Session APIs - Device Tracking, Session Revocation & Logout", () => {
  let user1;
  let user2;
  let currentSessionId;
  let otherSessionId1;
  let otherSessionId2;
  let user1Token;
  let user2Token;
  let user2SessionId;

  const testPrefix = `session_test_${Date.now()}`;

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

    user1 = await User.create({
      name: "Session Test User 1",
      email: `${testPrefix}_user1@example.com`,
      password: "Password123!",
      gender: "male",
      dob: new Date("1996-01-01"),
      role: "user",
      status: "active",
      isVerified: true,
      trustedDevices: [
        { deviceId: "device_user1_current", deviceName: "Windows Chrome" },
        { deviceId: "device_user1_other1", deviceName: "MacBook Firefox" },
        { deviceId: "device_user1_other2", deviceName: "iPhone Safari" },
      ],
    });

    currentSessionId = `session_curr_${Date.now()}`;
    otherSessionId1 = `session_other1_${Date.now()}`;
    otherSessionId2 = `session_other2_${Date.now()}`;

    // Create 3 sessions for User 1
    await Session.create([
      {
        userId: user1._id,
        sessionId: currentSessionId,
        deviceId: "device_user1_current",
        browser: "Chrome",
        os: "Windows",
        device: "Desktop",
        ipAddress: "127.0.0.1",
      },
      {
        userId: user1._id,
        sessionId: otherSessionId1,
        deviceId: "device_user1_other1",
        browser: "Firefox",
        os: "macOS",
        device: "Desktop",
        ipAddress: "192.168.1.10",
      },
      {
        userId: user1._id,
        sessionId: otherSessionId2,
        deviceId: "device_user1_other2",
        browser: "Safari",
        os: "iOS",
        device: "Mobile",
        ipAddress: "192.168.1.20",
      },
    ]);

    user1Token = makeToken(user1, currentSessionId);

    // 2. Create User 2 for isolation testing
    user2 = await User.create({
      name: "Session Test User 2",
      email: `${testPrefix}_user2@example.com`,
      password: "Password123!",
      gender: "female",
      dob: new Date("1998-02-02"),
      role: "user",
      status: "active",
      isVerified: true,
    });

    user2SessionId = `session_user2_${Date.now()}`;
    await Session.create({
      userId: user2._id,
      sessionId: user2SessionId,
      deviceId: "device_user2_main",
      browser: "Chrome",
      os: "Linux",
      device: "Desktop",
      ipAddress: "10.0.0.1",
    });

    user2Token = makeToken(user2, user2SessionId);
  });

  afterAll(async () => {
    await Session.deleteMany({ userId: { $in: [user1?._id, user2?._id] } });
    await User.deleteMany({ _id: { $in: [user1?._id, user2?._id] } });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("Authentication & Security", () => {
    test("TC_01: Token missing par 401 Unauthorized milna chahiye", async () => {
      const res = await request(app).get("/sessions");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("No token provided");
    });

    test("TC_02: Invalid / malformed token par 401 Unauthorized milna chahiye", async () => {
      const res = await request(app)
        .get("/sessions")
        .set("Authorization", "Bearer invalid.token.xyz");

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid authentication token");
    });

    test("TC_03: Token me encoded session DB me na milne par 401 milna chahiye", async () => {
      const ghostToken = makeToken(user1, "non_existent_session_id");
      const res = await request(app)
        .get("/sessions")
        .set("Authorization", `Bearer ${ghostToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Session expired or revoked");
    });
  });

  describe("GET /sessions", () => {
    test("TC_04: Valid token par sabhi active device sessions ki list milni chahiye (200 OK)", async () => {
      const res = await request(app)
        .get("/sessions")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);

      const first = res.body[0];
      expect(first).toHaveProperty("sessionId");
      expect(first).toHaveProperty("browser");
      expect(first).toHaveProperty("os");
      expect(first).toHaveProperty("device");
      expect(first).toHaveProperty("ipAddress");
      expect(first).toHaveProperty("createdAt");
      expect(first).toHaveProperty("isCurrent");
    });

    test("TC_05: Current active session par isCurrent: true aur baakiyo par false hona chahiye", async () => {
      const res = await request(app)
        .get("/sessions")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);

      const current = res.body.find((s) => s.sessionId === currentSessionId);
      expect(current).toBeDefined();
      expect(current.isCurrent).toBe(true);

      const other1 = res.body.find((s) => s.sessionId === otherSessionId1);
      expect(other1).toBeDefined();
      expect(other1.isCurrent).toBe(false);

      const other2 = res.body.find((s) => s.sessionId === otherSessionId2);
      expect(other2).toBeDefined();
      expect(other2.isCurrent).toBe(false);
    });

    test("TC_06: Dusre users ke sessions list me shamil nahi hone chahiye (Data Isolation)", async () => {
      const res = await request(app)
        .get("/sessions")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      const hasUser2Session = res.body.some(
        (s) => s.sessionId === user2SessionId,
      );
      expect(hasUser2Session).toBe(false);
    });
  });

  describe("DELETE /sessions/:sessionId", () => {
    test("TC_07: Apne current active session ko revoke karne par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .delete(`/sessions/${currentSessionId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "Cannot revoke your current active device session from here",
      );
    });

    test("TC_08: Non-existent sessionId par 404 Not Found milna chahiye", async () => {
      const fakeSessionId = "non_existent_fake_session";
      const res = await request(app)
        .delete(`/sessions/${fakeSessionId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Session not found");
    });

    test("TC_09: Kisi aur user ke sessionId ko revoke karne par 404 milna chahiye (Security check)", async () => {
      const res = await request(app)
        .delete(`/sessions/${user2SessionId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Session not found");

      const u2Session = await Session.findOne({ sessionId: user2SessionId });
      expect(u2Session).toBeTruthy();
    });

    test("TC_10: Specific other session revoke karne par 200 OK aur trustedDevices se remove hona chahiye", async () => {
      const res = await request(app)
        .delete(`/sessions/${otherSessionId1}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Session revoked successfully");

      const inDb = await Session.findOne({ sessionId: otherSessionId1 });
      expect(inDb).toBeNull();

      const updatedUser = await User.findById(user1._id);
      const isTrusted = updatedUser.trustedDevices.some(
        (d) => d.deviceId === "device_user1_other1",
      );
      expect(isTrusted).toBe(false);
    });
  });

  describe("DELETE /sessions/logout-others", () => {
    test("TC_11: Sabhi dusre device sessions revoke hokar current session active rehna chahiye (200 OK)", async () => {
      const res = await request(app)
        .delete("/sessions/logout-others")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain(
        "Other devices logged out and untrusted successfully",
      );

      const remainingSessions = await Session.find({ userId: user1._id });
      expect(remainingSessions.length).toBe(1);
      expect(remainingSessions[0].sessionId).toBe(currentSessionId);

      const updatedUser = await User.findById(user1._id);
      const hasOtherDevice = updatedUser.trustedDevices.some(
        (d) => d.deviceId === "device_user1_other2",
      );
      expect(hasOtherDevice).toBe(false);
    });

    test("TC_12: Jab user ke paas sirf 1 session ho, tab bhi logout-others bina error ke chalna chahiye (200 OK)", async () => {
      const res = await request(app)
        .delete("/sessions/logout-others")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain(
        "Other devices logged out and untrusted successfully",
      );
    });
  });

  describe("DELETE /logout", () => {
    test("TC_13: Current active device successfully logout hona chahiye (200 OK)", async () => {
      const res = await request(app)
        .delete("/logout")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Logged out successfully");

      const inDb = await Session.findOne({ sessionId: currentSessionId });
      expect(inDb).toBeNull();
    });

    test("TC_14: Logout ke baad usi token se request karne par 401 Unauthorized milna chahiye", async () => {
      const res = await request(app)
        .get("/sessions")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Session expired or revoked");
    });
  });
});
