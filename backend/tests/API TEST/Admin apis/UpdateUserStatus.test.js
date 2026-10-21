const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../server");
const User = require("../../models/user");

describe("Update User Status API Tests", () => {
  let admin;
  let normalUser;
  let adminToken;
  let userToken;
  let targetUser;

  const prefix = `update_status_${Date.now()}`;

  const createToken = (user) =>
    jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

  const createTargetUser = (overrides = {}) =>
    User.create({
      name: "Status Test User",
      email: `${prefix}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}@example.com`,
      password: "Test@123456",
      role: "user",
      status: "active",
      isVerified: true,
      gender: "male",
      dob: new Date("2002-05-15"),
      ...overrides,
    });

  const updateStatus = (id, status, token = adminToken) => {
    let req = request(app).patch(`/api/admin/users/${id}/status`);

    if (token) {
      req = req.set("Authorization", `Bearer ${token}`);
    }

    return req.send(status === undefined ? {} : { status });
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    admin = await User.create({
      name: "Status Test Admin",
      email: `${prefix}_admin@example.com`,
      password: "Admin@123456",
      role: "admin",
      status: "active",
      isVerified: true,
      gender: "male",
      dob: new Date("1995-01-01"),
    });

    normalUser = await User.create({
      name: "Status Test Normal User",
      email: `${prefix}_normal@example.com`,
      password: "User@123456",
      role: "user",
      status: "active",
      isVerified: true,
      gender: "female",
      dob: new Date("2000-01-01"),
    });

    adminToken = createToken(admin);
    userToken = createToken(normalUser);
  });

  afterAll(async () => {
    await User.deleteMany({
      email: { $regex: `^${prefix}` },
    });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    targetUser = await createTargetUser();
  });

  afterEach(async () => {
    if (targetUser?._id) {
      await User.deleteOne({ _id: targetUser._id });
    }
  });

  // TC_01: Missing token
  test("TC_01: Token missing par 401 aana chahiye", async () => {
    const res = await updateStatus(targetUser._id, "suspended", null);

    expect(res.status).toBe(401);
  });

  // TC_02: Invalid token
  test("TC_02: Invalid token reject hona chahiye", async () => {
    const res = await updateStatus(
      targetUser._id,
      "suspended",
      "invalid.token.value",
    );

    expect(res.status).toBe(401);
  });

  // TC_03: Normal user access
  test("TC_03: Normal user ko 403 milna chahiye", async () => {
    const res = await updateStatus(targetUser._id, "suspended", userToken);

    expect(res.status).toBe(403);

    const unchanged = await User.findById(targetUser._id);
    expect(unchanged.status).toBe("active");
  });

  test("TC_04: User status active update hona chahiye", async () => {
    await User.updateOne(
      { _id: targetUser._id },
      { $set: { status: "suspended" } },
    );

    const res = await updateStatus(targetUser._id, "active");

    expect(res.status).toBe(200);

    const updated = await User.findById(targetUser._id);
    expect(updated.status).toBe("active");
  });

  test("TC_05: User status suspended update hona chahiye", async () => {
    const res = await updateStatus(targetUser._id, "suspended");

    expect(res.status).toBe(200);

    const updated = await User.findById(targetUser._id);
    expect(updated.status).toBe("suspended");
  });

  test("TC_06: User status banned update hona chahiye", async () => {
    const res = await updateStatus(targetUser._id, "banned");

    expect(res.status).toBe(200);

    const updated = await User.findById(targetUser._id);
    expect(updated.status).toBe("banned");
  });

  test("TC_07: Invalid status reject hona chahiye", async () => {
    const res = await updateStatus(targetUser._id, "unknown_status");

    expect([400, 422]).toContain(res.status);

    const unchanged = await User.findById(targetUser._id);
    expect(unchanged.status).toBe("active");
  });

  test("TC_08: Status field missing hone par validation error aana chahiye", async () => {
    const res = await updateStatus(targetUser._id, undefined);

    expect([400, 422]).toContain(res.status);

    const unchanged = await User.findById(targetUser._id);
    expect(unchanged.status).toBe("active");
  });

  test("TC_09: Empty status reject hona chahiye", async () => {
    const res = await updateStatus(targetUser._id, "");

    expect([400, 422]).toContain(res.status);

    const unchanged = await User.findById(targetUser._id);
    expect(unchanged.status).toBe("active");
  });

  test("TC_10: Invalid MongoDB ID reject hona chahiye", async () => {
    const res = await updateStatus("invalid-id", "suspended");

    expect([400, 404, 500]).toContain(res.status);
  });

  test("TC_11: Non-existing user par 404 aana chahiye", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await updateStatus(fakeId, "suspended");

    expect(res.status).toBe(404);
  });

  test("TC_12: Same status dobara set karne par API crash nahi honi chahiye", async () => {
    const res = await updateStatus(targetUser._id, "active");

    expect([200, 204]).toContain(res.status);

    const updated = await User.findById(targetUser._id);
    expect(updated.status).toBe("active");
  });

  test("TC_13: Status update se name aur email change nahi hone chahiye", async () => {
    const originalName = targetUser.name;
    const originalEmail = targetUser.email;

    const res = await updateStatus(targetUser._id, "suspended");

    expect(res.status).toBe(200);

    const updated = await User.findById(targetUser._id);

    expect(updated.status).toBe("suspended");
    expect(updated.name).toBe(originalName);
    expect(updated.email).toBe(originalEmail);
  });

  test("TC_14: Updated status database me persist hona chahiye", async () => {
    const res = await updateStatus(targetUser._id, "banned");

    expect(res.status).toBe(200);

    const reloadedUser = await User.findById(targetUser._id);

    expect(reloadedUser).not.toBeNull();
    expect(reloadedUser.status).toBe("banned");
  });

  test("TC_15: Response me password expose nahi hona chahiye", async () => {
    const res = await updateStatus(targetUser._id, "suspended");

    expect(res.status).toBe(200);

    if (res.body && Object.keys(res.body).length > 0) {
      expect(res.body).not.toHaveProperty("password");

      if (res.body.user) {
        expect(res.body.user).not.toHaveProperty("password");
      }
    }
  });

  test("TC_16: Status request se role change nahi hona chahiye", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUser._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "suspended",
        role: "admin",
      });

    expect([200, 400, 422]).toContain(res.status);

    const updated = await User.findById(targetUser._id);

    expect(updated.status).toBe("suspended");
    expect(updated.role).toBe("user");
  });
});
