jest.mock("../../utils/sendEmail", () => jest.fn().mockResolvedValue(true));

const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const {
  app,
  User,
  ensureDb,
  makeUser,
  makeToken,
  cleanupUser,
} = require("./testUtils");

describe("Profile APIs - Details, Updates, Photo, Banner & Preferences", () => {
  let user1;
  let user2;
  let token1;
  let token2;

  beforeAll(async () => {
    await ensureDb();

    user1 = await makeUser({
      name: "Profile Main User",
      email: `profile_main_${Date.now()}@example.com`,
      phone: "9876543210",
      gender: "male",
      dob: new Date("1996-04-12"),
      bio: "Software developer",
      country: "India",
      state: "Gujarat",
      city: "Surat",
      profileBanner: "banner_1",
    });

    user2 = await makeUser({
      name: "Profile Secondary User",
      email: `profile_secondary_${Date.now()}@example.com`,
      phone: "9123456789",
      gender: "female",
      dob: new Date("1998-08-20"),
    });

    token1 = makeToken(user1);
    token2 = makeToken(user2);
  });

  afterAll(async () => {
    await cleanupUser(user1);
    await cleanupUser(user2);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("GET /profile", () => {
    test("TC_01: Missing token par 401 Unauthorized aana chahiye", async () => {
      const res = await request(app).get("/profile");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("No token provided");
    });

    test("TC_02: Invalid / fake token par 401 Unauthorized aana chahiye", async () => {
      const res = await request(app)
        .get("/profile")
        .set("Authorization", "Bearer invalid.fake.token");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid authentication token");
    });

    test("TC_03: Valid token par 200 OK aur user details milni chahiye (password excluded)", async () => {
      const res = await request(app)
        .get("/profile")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(user1._id.toString());
      expect(res.body.name).toBe("Profile Main User");
      expect(res.body.email).toBe(user1.email);
      expect(res.body.password).toBeUndefined();
      expect(res.body.resetPasswordToken).toBeUndefined();
    });

    test("TC_04: Non-existent user ID token par 401 aana chahiye", async () => {
      const ghostId = new mongoose.Types.ObjectId();
      const ghostToken = makeToken({
        _id: ghostId,
        email: "ghost@example.com",
        role: "user",
      });

      const res = await request(app)
        .get("/profile")
        .set("Authorization", `Bearer ${ghostToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("User account no longer exists");
    });
  });

  describe("PUT /profile", () => {
    test("TC_05: Name 3 characters se kam hone par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .put("/profile")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          name: "Ab",
          email: user1.email,
          gender: "male",
          dob: "1996-04-12",
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("name");
    });

    test("TC_06: Direct email change attempt karne par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .put("/profile")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          name: "Profile Main User",
          email: "completely_new_email@example.com",
          gender: "male",
          dob: "1996-04-12",
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("email");
      expect(res.body.message).toContain(
        "Email address changes must be performed through Security Settings",
      );
    });

    test("TC_07: Kisi aur user ka existing phone number use karne par 409 Conflict aana chahiye", async () => {
      const res = await request(app)
        .put("/profile")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          name: "Profile Main User",
          email: user1.email,
          gender: "male",
          dob: "1996-04-12",
          phone: user2.phone, // user2 ka phone
        });

      expect(res.status).toBe(409);
      expect(res.body.field).toBe("phone");
      expect(res.body.message).toContain("Phone number already exists");
    });

    test("TC_08: Valid profile data ke sath update successfully hona chahiye (200 OK)", async () => {
      const res = await request(app)
        .put("/profile")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          name: "Profile Main User Updated",
          email: user1.email,
          gender: "male",
          dob: "1996-04-12",
          phone: "9876543210",
          bio: "Senior Full Stack Engineer",
          country: "India",
          state: "Maharashtra",
          city: "Mumbai",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe("Profile Main User Updated");
      expect(res.body.user.bio).toBe("Senior Full Stack Engineer");
      expect(res.body.user.city).toBe("Mumbai");

      const updatedInDb = await User.findById(user1._id);
      expect(updatedInDb.name).toBe("Profile Main User Updated");
      expect(updatedInDb.city).toBe("Mumbai");
    });

    test("TC_09: Profile update me removePhoto: true bhejne par photo delete honi chahiye", async () => {
      user1.profilephoto = "dummy-test-photo.png";
      await user1.save();

      const res = await request(app)
        .put("/profile")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          name: "Profile Main User",
          email: user1.email,
          gender: "male",
          dob: "1996-04-12",
          removePhoto: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.user.profilephoto).toBe("");

      const updatedInDb = await User.findById(user1._id);
      expect(updatedInDb.profilephoto).toBe("");
    });
  });

 
  describe("PUT & POST /profile/photo", () => {
    test("TC_10: File provide na karne par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .put("/profile/photo")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("profilephoto");
      expect(res.body.message).toContain("Please select an image file");
    });

    test("TC_11: 5MB se badi photo bhejne par 400 Bad Request milna chahiye", async () => {
      const largeFileBuffer = Buffer.alloc(6 * 1024 * 1024);

      const res = await request(app)
        .put("/profile/photo")
        .set("Authorization", `Bearer ${token1}`)
        .attach("profilephoto", largeFileBuffer, {
          filename: "huge-photo.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(400);
      expect(res.body.field).toBe("profilephoto");
      expect(res.body.message).toContain("File size exceeds the 5MB limit");
    });

    test("TC_12: Valid PNG photo upload par 200 OK aur updated filename milna chahiye", async () => {
      const dummyPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64",
      );

      const res = await request(app)
        .put("/profile/photo")
        .set("Authorization", `Bearer ${token1}`)
        .attach("profilephoto", dummyPng, {
          filename: "avatar-test.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profilephoto).toMatch(/\.png$/);

      const uploadedFile = path.join(
        __dirname,
        "../../uploads",
        res.body.profilephoto,
      );
      expect(fs.existsSync(uploadedFile)).toBe(true);
      fs.unlinkSync(uploadedFile);
    });

    test("TC_13: POST /profile/photo route se bhi photo successfully upload honi chahiye (200 OK)", async () => {
      const dummyPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64",
      );

      const res = await request(app)
        .post("/profile/photo")
        .set("Authorization", `Bearer ${token1}`)
        .attach("profilephoto", dummyPng, {
          filename: "avatar-post-test.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profilephoto).toMatch(/\.png$/);

      
      const uploadedFile = path.join(
        __dirname,
        "../../uploads",
        res.body.profilephoto,
      );
      if (fs.existsSync(uploadedFile)) {
        fs.unlinkSync(uploadedFile);
      }
    });
  });

  describe("PUT /profile/banner", () => {
    test("TC_14: Banner identifier missing hone par 400 Bad Request milna chahiye", async () => {
      const res = await request(app)
        .put("/profile/banner")
        .set("Authorization", `Bearer ${token1}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Banner identifier is required");
    });

    test("TC_15: Valid banner identifier bhejne par 200 OK aur banner update hona chahiye", async () => {
      const res = await request(app)
        .put("/profile/banner")
        .set("Authorization", `Bearer ${token1}`)
        .send({ profileBanner: "cyber_neon_banner" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profileBanner).toBe("cyber_neon_banner");

      const inDb = await User.findById(user1._id);
      expect(inDb.profileBanner).toBe("cyber_neon_banner");
    });
  });

  describe("PUT /notification-preferences", () => {
    test("TC_16: Notification preferences update karne par 200 OK milna chahiye", async () => {
      const res = await request(app)
        .put("/notification-preferences")
        .set("Authorization", `Bearer ${token1}`)
        .send({ securityLoginAlerts: false });

      expect(res.status).toBe(200);
      expect(res.body.notificationPreferences.securityLoginAlerts).toBe(false);

      const inDb = await User.findById(user1._id);
      expect(inDb.notificationPreferences.securityLoginAlerts).toBe(false);
    });
  });
});
