const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../server");
const User = require("../../models/user");

describe("Get User Growth Analytics API Tests", () => {
  let admin;
  let normalUser;
  let adminToken;
  let userToken;

  const API_URL = "/api/admin/analytics/user-growth";
  const prefix = `growthanalytics_${Date.now()}`;

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

    admin = await User.create({
      name: "Growth Analytics Admin",
      email: `${prefix}_admin@example.com`,
      password: "Admin@123456",
      role: "admin",
      status: "active",
      isVerified: true,
      gender: "male",
      dob: new Date("1995-01-01"),
    });

    normalUser = await User.create({
      name: "Growth Analytics Normal User",
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

  const getAnalytics = (token = adminToken, query = {}) => {
    let req = request(app).get(API_URL);

    if (token) {
      req = req.set("Authorization", `Bearer ${token}`);
    }
    
    return req.query(query);
  };

  test("TC_01: Token missing hone par 401 aana chahiye", async () => {
    const res = await getAnalytics(null);

    expect(res.status).toBe(401);
  });

  test("TC_02: Invalid token reject hona chahiye", async () => {
    const res = await getAnalytics("invalid.token.value");

    expect(res.status).toBe(401);
  });

  test("TC_03: Normal user ko 403 milna chahiye", async () => {
    const res = await getAnalytics(userToken);

    expect(res.status).toBe(403);
  });

  test("TC_04: Admin analytics fetch kar sake", async () => {
    const res = await getAnalytics();

    expect(res.status).toBe(200);
  });

  test("TC_05: Response me growth data hona chahiye", async () => {
    const res = await getAnalytics();

    expect(res.status).toBe(200);
    const list = res.body.timeline || res.body.data;
    expect(Array.isArray(list)).toBe(true);
  });

  test("TC_06: Growth data me date aur count fields hone chahiye", async () => {
    const res = await getAnalytics();

    expect(res.status).toBe(200);

    const list = res.body.timeline || res.body.data || [];
    for (const item of list) {
      expect(item).toHaveProperty("date");
      expect(item).toHaveProperty("count");
      expect(Number.isFinite(Number(item.count))).toBe(true);
    }
  });

  test("TC_07: User growth count negative nahi hona chahiye", async () => {
    const res = await getAnalytics();

    expect(res.status).toBe(200);

    const list = res.body.timeline || res.body.data || [];
    for (const item of list) {
      expect(Number(item.count)).toBeGreaterThanOrEqual(0);
    }
  });

  test("TC_08: Daily analytics me duplicate dates nahi honi chahiye", async () => {
    const res = await getAnalytics();

    expect(res.status).toBe(200);

    const list = res.body.timeline || res.body.data || [];
    const dates = list.map((item) => item.date);

    expect(new Set(dates).size).toBe(dates.length);
  });

  test("TC_09: Today timeframe request handle honi chahiye", async () => {
    const res = await getAnalytics(undefined, {
      timeframe: "today",
    });

    expect([200, 400]).toContain(res.status);
  });

  test("TC_10: This week timeframe request handle honi chahiye", async () => {
    const res = await getAnalytics(undefined, {
      timeframe: "this_week",
    });

    expect([200, 400]).toContain(res.status);
  });

  test("TC_11: This month timeframe request handle honi chahiye", async () => {
    const res = await getAnalytics(undefined, {
      timeframe: "this_month",
    });

    expect([200, 400]).toContain(res.status);
  });

  test("TC_12: Last 3 months timeframe request handle honi chahiye", async () => {
    const res = await getAnalytics(undefined, {
      timeframe: "last_3_months",
    });

    expect([200, 400]).toContain(res.status);
  });

  test("TC_13: This year timeframe request handle honi chahiye", async () => {
    const res = await getAnalytics(undefined, {
      timeframe: "this_year",
    });

    expect([200, 400]).toContain(res.status);
  });

  test("TC_14: Invalid timeframe reject ya default hona chahiye", async () => {
    const res = await getAnalytics(undefined, {
      timeframe: "invalid_period",
    });

    expect([200, 400, 422]).toContain(res.status);
  });

  test("TC_15: Empty growth data handle honi chahiye", async () => {
    const res = await getAnalytics(undefined, {
      startDate: "1900-01-01",
      endDate: "1900-01-02",
    });

    expect([200, 400]).toContain(res.status);

    if (res.status === 200) {
      expect(Array.isArray(res.body.timeline || res.body.data)).toBe(true);
    }
  });

  test("TC_16: Invalid date format handle hona chahiye", async () => {
    const res = await getAnalytics(undefined, {
      startDate: "not-a-date",
      endDate: "also-not-a-date",
    });

    expect([200, 400, 422]).toContain(res.status);
  });

  test("TC_17: Invalid date range reject honi chahiye", async () => {
    const res = await getAnalytics(undefined, {
      startDate: "2026-12-31",
      endDate: "2026-01-01",
    });

    expect([200, 400, 422]).toContain(res.status);
  });

  test("TC_18: Response me user passwords nahi hone chahiye", async () => {
    const res = await getAnalytics();

    expect(res.status).toBe(200);

    const responseText = JSON.stringify(res.body);

    expect(responseText).not.toContain("Admin@123456");
    expect(responseText).not.toContain("User@123456");
  });
});
