const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../../server");

const User = require("../../../models/user");

const testPrefix = "getusers_jest";

const adminEmail = `${testPrefix}_admin@example.com`;
const user1Email = `${testPrefix}_rahul@example.com`;
const user2Email = `${testPrefix}_priya@example.com`;
const user3Email = `${testPrefix}_suspended@example.com`;
const user4Email = `${testPrefix}_unverified@example.com`;
const user5Email = `${testPrefix}_pending_invite@example.com`;

let admin;
let normalUser;
let adminToken;
let userToken;

const testEmails = [
  adminEmail,
  user1Email,
  user2Email,
  user3Email,
  user4Email,
  user5Email,
];

beforeAll(async () => {
  //  connection
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  } else if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET .env mein configured hona chahiye");
  }

  // test records remove karo
  await User.deleteMany({ email: { $in: testEmails } });

  admin = await User.create({
    name: "GetUsers Jest Admin",
    email: adminEmail,
    password: "test_password_hash",
    role: "admin",
    status: "active",
    isVerified: true,
    gender: "male",
    country: "India",
  });

  // user create karo
  normalUser = await User.create({
    name: "GetUsers Jest Normal User",
    email: `${testPrefix}_normal@example.com`,
    password: "test_password_hash",
    role: "user",
    status: "active",
    isVerified: true,
  });

  await User.create([
    {
      name: "GetUsers Rahul",
      email: user1Email,
      password: "test_password_hash",
      phone: "9876500011",
      role: "user",
      status: "active",
      isVerified: true,
      gender: "male",
      country: "India",
    },
    {
      name: "GetUsers Priya",
      email: user2Email,
      password: "test_password_hash",
      phone: "9876500012",
      role: "user",
      status: "active",
      isVerified: true,
      gender: "female",
      country: "Canada",
    },
    {
      name: "GetUsers Suspended",
      email: user3Email,
      password: "test_password_hash",
      role: "user",
      status: "suspended",
      isVerified: true,
      gender: "male",
      country: "India",
    },
    {
      name: "GetUsers Unverified",
      email: user4Email,
      password: "test_password_hash",
      role: "user",
      status: "active",
      isVerified: false,
      gender: "female",
      country: "India",
    },
    {
      name: "GetUsers Pending Invite",
      email: user5Email,
      password: "test_password_hash",
      role: "user",
      status: "active",
      isVerified: false,
      inviteStatus: "pending",
      gender: "male",
      country: "India",
    },
  ]);

  adminToken = jwt.sign({ id: admin._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  userToken = jwt.sign(
    { id: normalUser._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
});

afterAll(async () => {
  await User.deleteMany({
    email: {
      $in: [...testEmails, `${testPrefix}_normal@example.com`],
    },
  });

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe("GET /api/admin/users - getUsers API", () => {
  test("TC_01: Admin token ke bina 401 Unauthorized milna chahiye", async () => {
    const res = await request(app).get("/api/admin/users");

    expect(res.statusCode).toBe(401);
  });

  test("TC_02: Normal user ko 403 Forbidden milna chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("Admin only");
  });

  test("TC_03: Admin users successfully fetch kar sake", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body).toHaveProperty("totalCount");
    expect(res.body).toHaveProperty("currentPage");
    expect(res.body).toHaveProperty("totalPages");
    expect(res.body).toHaveProperty("stats");
  });

  test("TC_04: Current admin response ki users list mein nahi aana chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);

    const adminFound = res.body.users.some(
      (user) => user._id === admin._id.toString(),
    );

    expect(adminFound).toBe(false);
  });

  test("TC_05: Password response mein expose nahi hona chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: "GetUsers Rahul" });

    expect(res.statusCode).toBe(200);

    expect(res.body.users.length).toBeGreaterThan(0);

    res.body.users.forEach((user) => {
      expect(user).not.toHaveProperty("password");
    });
  });

  test("TC_06: Name se search karne par matching user milna chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: "GetUsers Rahul" });

    expect(res.statusCode).toBe(200);

    expect(res.body.users.some((user) => user.email === user1Email)).toBe(true);
  });

  test("TC_07: Email se search karne par matching user milna chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: user2Email });

    expect(res.statusCode).toBe(200);

    expect(res.body.users.some((user) => user.email === user2Email)).toBe(true);
  });

  test("TC_08: Phone se search karne par matching user milna chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: "9876500011" });

    expect(res.statusCode).toBe(200);

    expect(res.body.users.some((user) => user.email === user1Email)).toBe(true);
  });

  test("TC_09: Role=user filter par sirf user-role records aane chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ role: "user", search: "getusers_jest" });

    expect(res.statusCode).toBe(200);

    res.body.users.forEach((user) => {
      expect(user.role).toBe("user");
    });
  });

  test("TC_10: Role=admin filter par sirf admin records aane chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ role: "admin" });

    expect(res.statusCode).toBe(200);

    res.body.users.forEach((user) => {
      expect(user.role).toBe("admin");
    });

    //  admin khud exclude hota hai.
    expect(
      res.body.users.some((user) => user._id === admin._id.toString()),
    ).toBe(false);
  });

  test("TC_11: Gender filter matching users return kare", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        gender: "female",
        search: "getusers_jest",
      });

    expect(res.statusCode).toBe(200);

    res.body.users.forEach((user) => {
      expect(user.gender.toLowerCase()).toBe("female");
    });
  });

  test("TC_12: Country filter matching users return kare", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        country: "Canada",
        search: "getusers_jest",
      });

    expect(res.statusCode).toBe(200);

    expect(res.body.users.some((user) => user.email === user2Email)).toBe(true);

    res.body.users.forEach((user) => {
      expect(user.country.toLowerCase()).toContain("canada");
    });
  });

  test("TC_13: Suspended status filter sirf suspended users de", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        status: "suspended",
        search: "getusers_jest",
      });

    expect(res.statusCode).toBe(200);

    expect(res.body.users.some((user) => user.email === user3Email)).toBe(true);

    res.body.users.forEach((user) => {
      expect(user.status).toBe("suspended");
    });
  });

  test("TC_14: Verification=verified filter verified users de", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        verification: "verified",
        search: "getusers_jest",
      });

    expect(res.statusCode).toBe(200);

    res.body.users.forEach((user) => {
      expect(user.isVerified).toBe(true);
    });
  });

  test("TC_15: Verification=unverified filter unverified users de", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        verification: "unverified",
        search: "getusers_jest",
      });

    expect(res.statusCode).toBe(200);

    expect(res.body.users.some((user) => user.email === user4Email)).toBe(true);

    res.body.users.forEach((user) => {
      expect(user.isVerified).toBe(false);
    });
  });

  test("TC_16: Pagination limit=5 par maximum 5 users aane chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        search: "getusers_jest",
        page: 1,
        limit: 5,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.users.length).toBeLessThanOrEqual(5);
    expect(res.body.currentPage).toBe(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
  });

  test("TC_17: Page=2 request par currentPage=2 return hona chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        search: "getusers_jest",
        page: 2,
        limit: 5,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.currentPage).toBe(2);
  });

  test("TC_18: Default limit apply hona chahiye (maximum 5 users)", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: "getusers_jest" });

    expect(res.statusCode).toBe(200);
    expect(res.body.users.length).toBeLessThanOrEqual(5);
  });

  test("TC_19: Stats object ke expected fields hone chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);

    expect(res.body.stats).toHaveProperty("totalUsers");
    expect(res.body.stats).toHaveProperty("verifiedUsersCount");
    expect(res.body.stats).toHaveProperty("adminUsersCount");
    expect(res.body.stats).toHaveProperty("todayUsersCount");
    expect(res.body.stats).toHaveProperty("activeUsersCount");
    expect(res.body.stats).toHaveProperty("unverifiedUsersCount");
    expect(res.body.stats).toHaveProperty("suspendedUsersCount");
    expect(res.body.stats).toHaveProperty("bannedUsersCount");
    expect(res.body.stats).toHaveProperty("pendingInvitesCount");
  });

  test("TC_20: Search ka koi match nahi ho to empty users array mile", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        search: "no_matching_getusers_record_928374",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toEqual([]);
    expect(res.body.totalCount).toBe(0);
    expect(res.body.totalPages).toBe(0);
  });

  test("TC_21: Sort ascending order mein users return hone chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        search: "getusers_jest",
        sortBy: "name",
        sortOrder: "asc",
        limit: 20,
      });

    expect(res.statusCode).toBe(200);

    const names = res.body.users.map((user) => user.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));

    expect(names).toEqual(sortedNames);
  });

  test("TC_22: Default/descending sorting mein users descending order mein hone chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        search: "getusers_jest",
        sortBy: "name",
        sortOrder: "desc",
        limit: 20,
      });

    expect(res.statusCode).toBe(200);

    const names = res.body.users.map((user) => user.name);
    const sortedNames = [...names].sort((a, b) => b.localeCompare(a));

    expect(names).toEqual(sortedNames);
  });

  test("TC_23: Active status filter mein active users return hone chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        status: "active",
        search: "getusers_jest",
      });

    expect(res.statusCode).toBe(200);

    res.body.users.forEach((user) => {
      expect(["active", undefined]).toContain(user.status);
    });
  });

  test("TC_24: Banned status filter mein sirf banned users return hone chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        status: "banned",
        search: "getusers_jest",
      });

    expect(res.statusCode).toBe(200);

    res.body.users.forEach((user) => {
      expect(user.status).toBe("banned");
    });
  });

  test("TC_25: Invalid timeframe par default behavior work karna chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        timeframe: "invalid_timeframe",
        search: "getusers_jest",
      });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  test("TC_26: Invalid token par 401 Unauthorized milna chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer invalid.test.token");

    expect(res.statusCode).toBe(401);
  });

  test("TC_27: Search aur status filter saath apply hone chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        search: "getusers_jest",
        status: "suspended",
        limit: 20,
      });

    expect(res.statusCode).toBe(200);

    res.body.users.forEach((user) => {
      expect(user.status).toBe("suspended");
      expect(
        `${user.name} ${user.email} ${user.phone || ""}`.toLowerCase(),
      ).toContain("getusers_jest");
    });
  });

  test("TC_28: Verification=pending_invite filter sirf pending invite users return kare", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        verification: "pending_invite",
        search: "getusers_jest",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.users.some((user) => user.email === user5Email)).toBe(true);

    res.body.users.forEach((user) => {
      expect(user.inviteStatus).toBe("pending");
    });
  });

  test("TC_29: Valid timeframe=today filter matching newly created users return kare", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        timeframe: "today",
        search: "getusers_jest",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    res.body.users.forEach((user) => {
      expect(new Date(user.createdAt) >= todayStart).toBe(true);
    });
  });

  test("TC_30: Enhanced fields (isOnline aur activeSessionCount) response users mein present hone chahiye", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: "getusers_jest" });

    expect(res.statusCode).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);

    res.body.users.forEach((user) => {
      expect(user).toHaveProperty("activeSessionCount");
      expect(typeof user.activeSessionCount).toBe("number");
      expect(user).toHaveProperty("isOnline");
      expect([true, false, null]).toContain(user.isOnline);
    });
  });
});
