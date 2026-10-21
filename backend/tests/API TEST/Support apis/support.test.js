const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../server");
const User = require("../../models/user");
const Ticket = require("../../models/ticket");
const Notification = require("../../models/notification");

describe("Support APIs - System Status & Customer Support Tickets", () => {
  let user1;
  let user2;
  let adminUser;
  let token1;
  let token2;

  function makeToken(user) {
    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
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

    const testPrefix = `support_test_${Date.now()}`;

    // 1. Create Regular Users and Admin User
    user1 = await User.create({
      name: "Support User 1",
      email: `${testPrefix}_u1@example.com`,
      password: "Password123!",
      gender: "male",
      dob: new Date("1995-01-01"),
      role: "user",
      status: "active",
      isVerified: true,
    });

    user2 = await User.create({
      name: "Support User 2",
      email: `${testPrefix}_u2@example.com`,
      password: "Password123!",
      gender: "female",
      dob: new Date("1996-02-02"),
      role: "user",
      status: "active",
      isVerified: true,
    });

    adminUser = await User.create({
      name: "Support Admin User",
      email: `${testPrefix}_admin@example.com`,
      password: "Password123!",
      gender: "male",
      dob: new Date("1990-01-01"),
      role: "admin",
      status: "active",
      isVerified: true,
    });

    token1 = makeToken(user1);
    token2 = makeToken(user2);
  });

  afterAll(async () => {
    await Ticket.deleteMany({
      userId: { $in: [user1?._id, user2?._id, adminUser?._id] },
    });
    await Notification.deleteMany({
      userId: { $in: [user1?._id, user2?._id, adminUser?._id] },
    });
    await User.deleteMany({
      _id: { $in: [user1?._id, user2?._id, adminUser?._id] },
    });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ─── 1. GET /support/status ───
  describe("GET /support/status", () => {
    test("TC_01: Public status route par 200 OK aur system operational stats milne chahiye (bina token)", async () => {
      const res = await request(app).get("/support/status");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("status");
      expect(res.body).toHaveProperty("systems");
      expect(res.body.systems).toHaveProperty("api");
      expect(res.body.systems).toHaveProperty("database");
      expect(res.body.systems).toHaveProperty("auth2FA");
      expect(res.body.systems).toHaveProperty("emailService");
    });
  });

  // ─── 2. POST /support/ticket ───
  describe("POST /support/ticket", () => {
    test("TC_02: Missing token par 401 Unauthorized aana chahiye", async () => {
      const res = await request(app).post("/support/ticket").send({
        subject: "Login issue",
        message: "I am unable to login with my device",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("No token provided");
    });

    test("TC_03: Subject missing ya 3 characters se kam hone par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .post("/support/ticket")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          subject: "Hi",
          message: "This is a detailed issue description.",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "Subject must be at least 3 characters long",
      );
    });

    test("TC_04: Message missing ya 10 characters se kam hone par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .post("/support/ticket")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          subject: "Valid Subject Line",
          message: "Too short",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "Message must be at least 10 characters long",
      );
    });

    test("TC_05: Sahi data ke sath ticket create hona chahiye (201 Created)", async () => {
      const res = await request(app)
        .post("/support/ticket")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          category: "Account & Security",
          priority: "normal",
          subject: "Cannot update phone number",
          message:
            "Getting error whenever I try to update phone number in settings.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket).toBeDefined();
      expect(res.body.ticket.ticketId).toMatch(/^TICK-\d+/);
      expect(res.body.ticket.status).toBe("open");
      expect(res.body.ticket.category).toBe("Account & Security");
      expect(res.body.ticket.priority).toBe("normal");
      expect(res.body.ticket.estimatedResponseTime).toBe("Under 2 hours");

      // Verify in DB
      const inDb = await Ticket.findOne({ ticketId: res.body.ticket.ticketId });
      expect(inDb).toBeTruthy();
      expect(inDb.userId.toString()).toBe(user1._id.toString());
    });

    test("TC_06: Urgent priority ticket par response time 'Under 30 minutes' set hona chahiye", async () => {
      const res = await request(app)
        .post("/support/ticket")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          category: "Bug Report",
          priority: "urgent",
          subject: "Critical security issue",
          message: "Please investigate this urgently as it affects security.",
        });

      expect(res.status).toBe(201);
      expect(res.body.ticket.priority).toBe("urgent");
      expect(res.body.ticket.estimatedResponseTime).toBe("Under 30 minutes");
    });

    test("TC_07: Invalid category hone par default 'General Inquiry' par fallback hona chahiye", async () => {
      const res = await request(app)
        .post("/support/ticket")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          category: "Unknown Custom Random Category",
          priority: "normal",
          subject: "General query about the platform",
          message: "I have a question about how the platform functions.",
        });

      expect(res.status).toBe(201);
      expect(res.body.ticket.category).toBe("General Inquiry");
    });

    test("TC_08: Ticket creation par admin aur user ke liye in-app notifications generate honi chahiye", async () => {
      // Create ticket by user 1
      const res = await request(app)
        .post("/support/ticket")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          category: "Feature Request",
          priority: "high",
          subject: "Dark mode request for mobile",
          message:
            "Would love to see AMOLED dark mode supported on mobile screens.",
        });

      expect(res.status).toBe(201);

      // Verify admin notification
      const adminNotif = await Notification.findOne({
        userId: adminUser._id,
        type: "security_alert",
        "metadata.ticketId": res.body.ticket.ticketId,
      });
      expect(adminNotif).toBeTruthy();

      // Verify user confirmation notification
      const userNotif = await Notification.findOne({
        userId: user1._id,
        "metadata.ticketId": res.body.ticket.ticketId,
      });
      expect(userNotif).toBeTruthy();
    });
  });

  // ─── 3. GET /support/my-tickets ───
  describe("GET /support/my-tickets", () => {
    test("TC_09: Missing token par 401 Unauthorized aana chahiye", async () => {
      const res = await request(app).get("/support/my-tickets");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("No token provided");
    });

    test("TC_10: Valid user apne sabhi tickets ki list fetch kar sake (200 OK)", async () => {
      const res = await request(app)
        .get("/support/my-tickets")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.tickets)).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.tickets.length).toBe(res.body.count);

      // Check fields
      const first = res.body.tickets[0];
      expect(first).toHaveProperty("ticketId");
      expect(first).toHaveProperty("subject");
      expect(first).toHaveProperty("message");
      expect(first).toHaveProperty("category");
      expect(first).toHaveProperty("status");
    });

    test("TC_11: Dusre user ke tickets response me nahi aane chahiye (Data Isolation)", async () => {
      // User 2 fetches tickets (User 2 has created 0 tickets)
      const res = await request(app)
        .get("/support/my-tickets")
        .set("Authorization", `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.tickets.length).toBe(0);
    });
  });
});
