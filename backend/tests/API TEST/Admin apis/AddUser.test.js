jest.mock("../../../utils/sendEmail", () => jest.fn().mockResolvedValue(true));
jest.mock("../../../utils/emailValidator", () => ({
  validateEmailDeliverability: jest.fn().mockImplementation(async (email) => {
    if (
      !email ||
      !email.includes("@") ||
      email.startsWith("@") ||
      email.endsWith("@") ||
      email === "not-an-email"
    ) {
      return {
        valid: false,
        code: "INVALID_FORMAT",
        reason: "Please enter a valid email address.",
        suggestion: null,
        normalized: email,
      };
    }
    return {
      valid: true,
      code: "OK",
      reason: "Email domain can receive mail.",
      suggestion: null,
      normalized: email,
    };
  }),
  DISPOSABLE_DOMAINS: new Set(),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../../server");
const User = require("../../../models/user");

describe("Admin Add User API Tests", () => {
  let admin;
  let normalUser;
  let adminToken;
  let userToken;

  const testPrefix = `adduser_${Date.now()}`;

  const validUser = (overrides = {}) => ({
    name: "Test New User",
    email: `${testPrefix}_${Math.random().toString(36).slice(2, 8)}_new@example.com`,
    gender: "male",
    dob: "2002-05-15",
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
    } else if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise();
    }

    admin = await User.create({
      name: "Add User Test Admin",
      email: `${testPrefix}_admin@example.com`,
      password: "Admin@123456",
      gender: "male",
      dob: new Date("1995-01-01"),
      role: "admin",
      status: "active",
      isVerified: true,
    });

    normalUser = await User.create({
      name: "Add User Test Normal",
      email: `${testPrefix}_normal@example.com`,
      password: "User@123456",
      gender: "male",
      dob: new Date("2000-01-01"),
      role: "user",
      status: "active",
      isVerified: true,
    });

    adminToken = createToken(admin);
    userToken = createToken(normalUser);
  });

  afterAll(async () => {
    await User.deleteMany({
      email: { $regex: `^${testPrefix}` },
    });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test("TC_01: Token missing hone par 401 aana chahiye", async () => {
    const res = await request(app).post("/api/admin/users").send(validUser());

    expect(res.status).toBe(401);
  });

  test("TC_02: Invalid token par 401 aana chahiye", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", "Bearer invalid.token.value")
      .send(validUser());

    expect(res.status).toBe(401);
  });

  test("TC_03: Normal user ko 403 milna chahiye", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`)
      .send(validUser());

    expect(res.status).toBe(403);
  });

  test("TC_04: Admin valid user create (invite) kar sake", async () => {
    const payload = validUser();

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.inviteStatus).toBe("pending");

    const savedUser = await User.findOne({
      email: payload.email.toLowerCase(),
    });

    expect(savedUser).not.toBeNull();
    expect(savedUser.name).toBe(payload.name);
    expect(savedUser.accountSource).toBe("admin_invited");
    expect(savedUser.inviteStatus).toBe("pending");
  });

  test("TC_05: Name missing hone par validation error aana chahiye", async () => {
    const payload = validUser();
    delete payload.name;

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)

      .send(payload);

    expect([400, 422]).toContain(res.status);
  });

  test("TC_06: Email missing hone par validation error aana chahiye", async () => {
    const payload = validUser();
    delete payload.email;

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect([400, 422]).toContain(res.status);
  });

  test("TC_07: Date of Birth (dob) missing hone par validation error aana chahiye", async () => {
    const payload = validUser();
    delete payload.dob;

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect([400, 422]).toContain(res.status);
  });

  test("TC_08: Invalid email reject hona chahiye", async () => {
    const payload = validUser();
    payload.email = "not-an-email";

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect([400, 422]).toContain(res.status);
  });

  test("TC_09: Duplicate email par user dobara create nahi hona chahiye", async () => {
    const payload = validUser();
    payload.email = admin.email;

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect([400, 409]).toContain(res.status);

    const count = await User.countDocuments({
      email: admin.email,
    });

    expect(count).toBe(1);
  });

  test("TC_10: Extra field jaise role bhejne par reject hona chahiye", async () => {
    const payload = validUser();
    payload.role = "superadmin";

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect([400, 422]).toContain(res.status);
  });

  test("TC_11: Invalid gender reject hona chahiye", async () => {
    const payload = validUser();
    payload.gender = "unknown-value";

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect([400, 422]).toContain(res.status);
  });

  test("TC_12: Response me password expose nahi hona chahiye", async () => {
    const payload = validUser();

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    if (res.body.user) {
      expect(res.body.user).not.toHaveProperty("password");
    }
  });

  test("TC_13: Ek request se sirf ek user create hona chahiye", async () => {
    const payload = validUser();

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);

    const count = await User.countDocuments({
      email: payload.email.toLowerCase(),
    });

    expect(count).toBe(1);
  });

  test("TC_14: Empty request body reject honi chahiye", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect([400, 422]).toContain(res.status);
  });

  test("TC_15: Blank name reject hona chahiye", async () => {
    const payload = validUser();
    payload.name = "   ";

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect([400, 422]).toContain(res.status);
  });

  test("TC_16: Password backend dwara securely placeholder hash hona chahiye", async () => {
    const payload = validUser();

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);

    const savedUser = await User.findOne({
      email: payload.email.toLowerCase(),
    }).select("+password");

    expect(savedUser).not.toBeNull();
    expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/);
  });
});
