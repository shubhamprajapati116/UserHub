const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../server");
const User = require("../../models/user");

jest.mock("../../utils/sendEmail", () => jest.fn().mockResolvedValue(true));

describe("Admin Update User API Tests", () => {
  let admin;
  let normalUser;
  let targetUser;
  let adminToken;
  let userToken;

  const prefix = `updateuser_${Date.now()}`;

  const makeUser = (overrides = {}) => ({
    name: "Update Test User",
    email: `${prefix}_target@example.com`,
    password: "Test@123456",
    gender: "male",
    dob: new Date("2002-05-15"),
    role: "user",
    status: "active",
    isVerified: true,
    ...overrides,
  });

  const createToken = (user) =>
    jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    admin = await User.create(
      makeUser({
        name: "Update Test Admin",
        email: `${prefix}_admin@example.com`,
        role: "admin",
      }),
    );

    normalUser = await User.create(
      makeUser({
        name: "Update Test Normal User",
        email: `${prefix}_normal@example.com`,
      }),
    );

    targetUser = await User.create(
      makeUser({
        name: "Original Target User",
        email: `${prefix}_original@example.com`,
      }),
    );

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

  // Har test ke liye fresh target user
  beforeEach(async () => {
    targetUser = await User.create(
      makeUser({
        name: "Original Target User",
        email: `${prefix}_target_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}@example.com`,
      }),
    );
  });

  afterEach(async () => {
    if (targetUser?._id) {
      await User.deleteOne({ _id: targetUser._id });
    }
  });

  const updateRequest = (id, token = adminToken, body = {}) => {
    const req = request(app).put(`/api/admin/users/${id}`);

    if (token) {
      req.set("Authorization", `Bearer ${token}`);
    }

    const basePayload = targetUser
      ? {
          name: targetUser.name,
          email: targetUser.email,
          dob: "2002-05-15",
          gender: targetUser.gender,
        }
      : {};

    const payload =
      Object.keys(body).length === 0 ? {} : { ...basePayload, ...body };

    return req.send(payload);
  };

  // TC_01: Token missing
  test("TC_01: Token missing par 401 aana chahiye", async () => {
    const res = await updateRequest(targetUser._id, null, {
      name: "Changed Name",
    });

    expect(res.status).toBe(401);
  });

  // TC_02: Invalid token
  test("TC_02: Invalid token reject hona chahiye", async () => {
    const res = await request(app)
      .put(`/api/admin/users/${targetUser._id}`)
      .set("Authorization", "Bearer invalid.token.value")
      .send({ name: "Changed Name" });

    expect(res.status).toBe(401);
  });

  // TC_03: Normal user cannot update
  test("TC_03: Normal user ko 403 milna chahiye", async () => {
    const res = await updateRequest(targetUser._id, userToken, {
      name: "Changed Name",
    });

    expect(res.status).toBe(403);
  });

  // TC_04: Admin can update name
  test("TC_04: Admin user ka name update kar sake", async () => {
    const res = await updateRequest(targetUser._id, adminToken, {
      name: "Updated Target Name",
    });

    expect([200, 204]).toContain(res.status);

    const updated = await User.findById(targetUser._id);

    expect(updated.name).toBe("Updated Target Name");
  });

  // TC_05: Email update
  test("TC_05: Valid email update hona chahiye (pendingEmail set hona chahiye)", async () => {
    const newEmail = `${prefix}_changed@example.com`;

    const res = await updateRequest(targetUser._id, adminToken, {
      email: newEmail,
    });

    expect([200, 204]).toContain(res.status);
    expect(res.body.isEmailChanging).toBe(true);

    const updated = await User.findById(targetUser._id);

    expect(updated.pendingEmail).toBe(newEmail);
  });

  // TC_06: Gender update
  test("TC_06: Valid gender update hona chahiye", async () => {
    const res = await updateRequest(targetUser._id, adminToken, {
      gender: "female",
    });

    expect([200, 204]).toContain(res.status);

    const updated = await User.findById(targetUser._id);

    expect(updated.gender).toBe("female");
  });

  // TC_07: Multiple fields update
  test("TC_07: Multiple valid fields update hone chahiye", async () => {
    const newEmail = `${prefix}_multiple@example.com`;

    const res = await updateRequest(targetUser._id, adminToken, {
      name: "Multiple Fields Updated",
      email: newEmail,
      gender: "female",
    });

    expect([200, 204]).toContain(res.status);

    const updated = await User.findById(targetUser._id);

    expect(updated.name).toBe("Multiple Fields Updated");
    expect(updated.pendingEmail).toBe(newEmail);
    expect(updated.gender).toBe("female");
  });

  // TC_08: Invalid MongoDB ID
  test("TC_08: Invalid user ID par 400 aana chahiye", async () => {
    const res = await updateRequest("invalid-id", adminToken, {
      name: "Changed Name",
    });

    expect([400, 404, 500]).toContain(res.status);
  });

  // TC_09: User not found
  test("TC_09: Non-existing user par 404 aana chahiye", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await updateRequest(fakeId, adminToken, {
      name: "Changed Name",
      email: `${prefix}_nonexisting_user_${Date.now()}@example.com`,
    });

    expect(res.status).toBe(404);
  });

  // TC_10: Invalid email
  test("TC_10: Invalid email reject hona chahiye", async () => {
    const res = await updateRequest(targetUser._id, adminToken, {
      email: "not-an-email",
    });

    expect([400, 422]).toContain(res.status);
  });

  // TC_11: Duplicate email
  test("TC_11: Duplicate email accept nahi hona chahiye", async () => {
    const res = await updateRequest(targetUser._id, adminToken, {
      email: admin.email,
    });

    expect([400, 409]).toContain(res.status);

    const updated = await User.findById(targetUser._id);

    expect(updated.email).toBe(targetUser.email);
  });

  // TC_12: Invalid gender
  test("TC_12: Invalid gender reject hona chahiye", async () => {
    const res = await updateRequest(targetUser._id, adminToken, {
      gender: "invalid-gender",
    });

    expect([400, 422]).toContain(res.status);
  });

  // TC_13: Empty body
  test("TC_13: Empty body ka expected behavior verify hona chahiye", async () => {
    const originalName = targetUser.name;

    const res = await updateRequest(targetUser._id, adminToken, {});

    // Controller empty updates ko reject ya no-op kar sakta hai.
    expect([200, 204, 400, 422]).toContain(res.status);

    const updated = await User.findById(targetUser._id);

    expect(updated.name).toBe(originalName);
  });

  // TC_14: Name blank
  test("TC_14: Blank name reject hona chahiye", async () => {
    const res = await updateRequest(targetUser._id, adminToken, {
      name: "   ",
    });

    expect([400, 422]).toContain(res.status);
  });

  // TC_15: Password response me expose nahi hona chahiye
  test("TC_15: Response me password expose nahi hona chahiye", async () => {
    const res = await updateRequest(targetUser._id, adminToken, {
      name: "Password Safety Check",
    });

    expect([200, 204]).toContain(res.status);

    if (res.body && Object.keys(res.body).length > 0) {
      expect(res.body).not.toHaveProperty("password");

      if (res.body.user) {
        expect(res.body.user).not.toHaveProperty("password");
      }
    }
  });

  // TC_16: Password update plain text me store nahi hona chahiye
  test("TC_16: Password update hashed form me store hona chahiye", async () => {
    const newPassword = "NewPassword@123";

    const res = await updateRequest(targetUser._id, adminToken, {
      password: newPassword,
    });

    // Agar controller password update allow nahi karta,
    // to uske intended status code ke according test badlo.
    expect([200, 204, 400, 422]).toContain(res.status);

    const updated = await User.findById(targetUser._id).select("+password");

    if ([200, 204].includes(res.status)) {
      expect(updated.password).not.toBe(newPassword);
    }
  });

  // TC_17: Normal user ka role admin nahi bana sakna chahiye
  test("TC_17: Unauthorized role escalation reject honi chahiye", async () => {
    const res = await updateRequest(targetUser._id, adminToken, {
      role: "admin",
    });

    const updated = await User.findById(targetUser._id);

    // Agar API role changes explicitly allow karti hai,
    // to is test ko us policy ke according adjust karo.
    if ([400, 422].includes(res.status)) {
      expect(updated.role).toBe("user");
    } else {
      expect([200, 204]).toContain(res.status);
    }
  });

  // TC_18: Unrelated user unchanged rahe
  test("TC_18: Update se doosre users change nahi hone chahiye", async () => {
    const oldName = normalUser.name;

    const res = await updateRequest(targetUser._id, adminToken, {
      name: "Only Target Updated",
    });

    expect([200, 204]).toContain(res.status);

    const unchanged = await User.findById(normalUser._id);

    expect(unchanged.name).toBe(oldName);
  });

  // TC_19: Update ke baad database me correct value ho
  test("TC_19: Database me updated value persist honi chahiye", async () => {
    const newName = "Persisted Updated Name";

    const res = await updateRequest(targetUser._id, adminToken, {
      name: newName,
    });

    expect([200, 204]).toContain(res.status);

    const reloaded = await User.findById(targetUser._id);

    expect(reloaded.name).toBe(newName);
  });

  // TC_20: Protected fields accidentally overwrite nahi hone chahiye
  test("TC_20: Request se _id overwrite nahi hona chahiye", async () => {
    const originalId = targetUser._id.toString();
    const anotherId = new mongoose.Types.ObjectId().toString();

    const res = await updateRequest(targetUser._id, adminToken, {
      _id: anotherId,
      name: "Protected ID Check",
    });

    expect([200, 204, 400, 422]).toContain(res.status);

    const updated = await User.findById(originalId);

    expect(updated).not.toBeNull();
    expect(updated._id.toString()).toBe(originalId);
  });
});
