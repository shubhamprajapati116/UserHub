jest.mock("../../../utils/sendEmail", () => jest.fn().mockResolvedValue(true));

const request = require("supertest");
const mongoose = require("mongoose");
const {
  app,
  User,
  ensureDb,
  makeUser,
  makeToken,
  cleanupUser,
} = require("./testUtils");

describe("Profile Experience APIs - Add, Update & Delete Experience Entries", () => {
  let user;
  let token;
  let createdExpId;

  beforeAll(async () => {
    await ensureDb();

    user = await makeUser({
      name: "Experience Test User",
      email: `exp_test_${Date.now()}@example.com`,
      experience: [],
    });

    token = makeToken(user);
  });

  afterAll(async () => {
    await cleanupUser(user);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ─── 1. POST /profile/experience ───
  describe("POST /profile/experience", () => {
    test("TC_01: Token missing hone par 401 Unauthorized milna chahiye", async () => {
      const res = await request(app).post("/profile/experience").send({
        title: "Frontend Engineer",
        company: "Tech Corp",
        startDate: "2022-01-01",
      });

      expect(res.status).toBe(401);
    });

    test("TC_02: Title missing hone par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/experience")
        .set("Authorization", `Bearer ${token}`)
        .send({
          company: "Tech Corp",
          startDate: "2022-01-01",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "Title, Company, and Start Date are required",
      );
    });

    test("TC_03: Company missing hone par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/experience")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Frontend Engineer",
          startDate: "2022-01-01",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "Title, Company, and Start Date are required",
      );
    });

    test("TC_04: Start Date missing hone par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .post("/profile/experience")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Frontend Engineer",
          company: "Tech Corp",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "Title, Company, and Start Date are required",
      );
    });

    test("TC_05: Valid experience data bhejne par 200 OK aur experience list me add hona chahiye", async () => {
      const res = await request(app)
        .post("/profile/experience")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Software Engineer",
          company: "Google",
          employmentType: "Full-time",
          location: "Bangalore, India",
          startDate: "2021-06-01",
          endDate: "2023-08-31",
          isCurrent: false,
          description: "Built scalable web apps using React and Node.js",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Experience added successfully");
      expect(res.body.user.experience.length).toBe(1);

      const added = res.body.user.experience[0];
      expect(added.title).toBe("Software Engineer");
      expect(added.company).toBe("Google");
      expect(added.isCurrent).toBe(false);

      createdExpId = added._id;

      // DB check
      const inDb = await User.findById(user._id);
      expect(inDb.experience.length).toBe(1);
    });

    test("TC_06: isCurrent: true bhejne par endDate null hona chahiye", async () => {
      const res = await request(app)
        .post("/profile/experience")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Lead Architect",
          company: "Microsoft",
          startDate: "2023-09-01",
          endDate: "2025-01-01", // should be cleared because isCurrent is true
          isCurrent: true,
        });

      expect(res.status).toBe(200);
      const currentJob = res.body.user.experience[0]; // unshifted to top
      expect(currentJob.title).toBe("Lead Architect");
      expect(currentJob.isCurrent).toBe(true);
      expect(currentJob.endDate).toBeNull();
    });
  });

  // ─── 2. PUT /profile/experience/:expId ───
  describe("PUT /profile/experience/:expId", () => {
    test("TC_07: Invalid expId bhejne par 404 Not Found milna chahiye", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/profile/experience/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Title",
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Experience entry not found");
    });

    test("TC_08: Valid expId par details update honi chahiye (200 OK)", async () => {
      const res = await request(app)
        .put(`/profile/experience/${createdExpId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Senior Software Engineer",
          company: "Alphabet Inc.",
          description: "Promoted to Senior Engineer",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Experience updated successfully");

      const inDb = await User.findById(user._id);
      const item = inDb.experience.id(createdExpId);
      expect(item.title).toBe("Senior Software Engineer");
      expect(item.company).toBe("Alphabet Inc.");
    });
  });

  // ─── 3. DELETE /profile/experience/:expId ───
  describe("DELETE /profile/experience/:expId", () => {
    test("TC_09: Valid expId delete karne par 200 OK aur array se remove hona chahiye", async () => {
      const res = await request(app)
        .delete(`/profile/experience/${createdExpId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Experience deleted successfully");

      // Verify removal in DB
      const inDb = await User.findById(user._id);
      const item = inDb.experience.id(createdExpId);
      expect(item).toBeNull();
    });
  });
});
