const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const app = require("../../../server");
const User = require("../../../models/user");
const bcrypt = require("bcrypt");

jest.mock("../../utils/sendEmail", () => jest.fn().mockResolvedValue(true));

const baseEmail = "test_register_base@gmail.com";
const existingEmail = "already_registered_user@gmail.com";
const successEmail1 = "fresh_reg_user_01@gmail.com";
const successEmail2 = "fresh_reg_user_02@gmail.com";
const testPassword = "Password123!";

const allTestEmails = [
  baseEmail,
  existingEmail,
  successEmail1,
  successEmail2,
  "filesize_test@gmail.com",
  "invalidfiletype@gmail.com",
];

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  await User.deleteMany({ email: { $in: allTestEmails } });

  const hashedPassword = await bcrypt.hash(testPassword, 10);
  await User.create({
    name: "Existing User",
    email: existingEmail,
    password: hashedPassword,
    gender: "male",
    dob: new Date("1992-05-15"),
    role: "user",
    isVerified: true,
  });
});

afterAll(async () => {
  const testUsers = await User.find({ email: { $in: allTestEmails } });
  for (const u of testUsers) {
    if (u.profilephoto) {
      const filePath = path.join(__dirname, "../../uploads", u.profilephoto);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore
        }
      }
    }
  }

  await User.deleteMany({ email: { $in: allTestEmails } });
  await mongoose.connection.close();
});

describe("POST /register - Complete Register API Test Suite", () => {
  test("TC_01: Name missing / empty string par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "",
      email: baseEmail,
      password: testPassword,
      gender: "male",
      dob: "1990-01-01",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("name");
  });

  test("TC_02: Name 3 characters se chhota (< 3 chars) hone par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "ab",
      email: baseEmail,
      password: testPassword,
      gender: "male",
      dob: "1990-01-01",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("name");
  });

  test("TC_03: Name 50 characters se zyada (> 50 chars) hone par 400 Bad Request milna chahiye", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "A".repeat(51),
        email: baseEmail,
        password: testPassword,
        gender: "male",
        dob: "1990-01-01",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("name");
  });

  test("TC_04: Email missing / empty string par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Name",
      email: "",
      password: testPassword,
      gender: "male",
      dob: "1990-01-01",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("email");
  });

  test("TC_05: Email invalid format (not an email) par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Name",
      email: "invalid-email-format",
      password: testPassword,
      gender: "male",
      dob: "1990-01-01",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("email");
  });

  test("TC_06: Disposable / Temporary email domain par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Name",
      email: "fakeuser@tempmail.com",
      password: testPassword,
      gender: "male",
      dob: "1990-01-01",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("email");
    expect(res.body.code).toBe("DISPOSABLE");
  });

  test("TC_07: Typo domain (e.g. gmaill.com) par 400 Bad Request aur suggestion milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Name",
      email: "testuser@gmaill.com",
      password: testPassword,
      gender: "male",
      dob: "1990-01-01",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("email");
    expect(res.body.code).toBe("NO_MX");
    expect(res.body.suggestion).toContain("gmail.com");
  });

  test("TC_08: Password missing / empty string par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Name",
      email: baseEmail,
      password: "",
      gender: "male",
      dob: "1990-01-01",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("password");
  });

  test("TC_09: Password 8 characters se chhota (< 8 chars) hone par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Name",
      email: baseEmail,
      password: "short",
      gender: "male",
      dob: "1990-01-01",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("password");
  });

  test("TC_10: Gender missing / empty string par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Name",
      email: baseEmail,
      password: testPassword,
      gender: "",
      dob: "1990-01-01",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("gender");
  });
  
  test("TC_11: Gender invalid value hone par 400 Bad Request milna chahiye (sirf male, female, other allowed)", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Name",
      email: baseEmail,
      password: testPassword,
      gender: "robot",
      dob: "1990-01-01",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("gender");
  });

  test("TC_12: DOB missing / empty string par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Name",
      email: baseEmail,
      password: testPassword,
      gender: "male",
      dob: "",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("dob");
  });

  test("TC_13: DOB invalid date format hone par 400 Bad Request milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Name",
      email: baseEmail,
      password: testPassword,
      gender: "male",
      dob: "invalid-date-format",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("dob");
  });

  test("TC_14: Profile photo ka size 5MB se zyada hone par 400 Bad Request (LIMIT_FILE_SIZE) milna chahiye", async () => {
    const largeFileBuffer = Buffer.alloc(6 * 1024 * 1024);

    const res = await request(app)
      .post("/register")
      .field("name", "Test User")
      .field("email", "filesize_test@gmail.com")
      .field("password", testPassword)
      .field("gender", "male")
      .field("dob", "1990-01-01")
      .attach("profilephoto", largeFileBuffer, {
        filename: "large-avatar.jpg",
        contentType: "image/jpeg",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("profilephoto");
    expect(res.body.message).toContain("File size exceeds the 5MB limit");
  });

  test("TC_15: Profile photo invalid file type (e.g. .txt ya .pdf) hone par 400 Bad Request milna chahiye", async () => {
    const invalidFileBuffer = Buffer.from(
      "This is a plain text file, not an image.",
    );

    const res = await request(app)
      .post("/register")
      .field("name", "Test User")
      .field("email", "invalidfiletype@gmail.com")
      .field("password", testPassword)
      .field("gender", "male")
      .field("dob", "1990-01-01")
      .attach("profilephoto", invalidFileBuffer, {
        filename: "invalid-document.txt",
        contentType: "text/plain",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("profilephoto");
    expect(res.body.message).toContain("Invalid file type");
  });

  test("TC_16: Already registered email se register karne par 409 Conflict milna chahiye", async () => {
    const res = await request(app).post("/register").send({
      name: "Existing User Clone",
      email: existingEmail,
      password: testPassword,
      gender: "male",
      dob: "1992-05-15",
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.field).toBe("email");
    expect(res.body.message).toBe("Email already exists");
  });

  test("TC_17: Sahi data ke sath successfully register hona chahiye (without photo -> 201 Created)", async () => {
    const res = await request(app).post("/register").send({
      name: "Fresh User Without Photo",
      email: successEmail1,
      password: testPassword,
      gender: "female",
      dob: "1995-08-20",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toContain("Registration successful");
    const created = await User.findOne({ email: successEmail1 });
    expect(created).toBeTruthy();
    expect(created.name).toBe("Fresh User Without Photo");
    expect(created.gender).toBe("female");
    expect(created.verificationToken).toBeTruthy();
    expect(created.profilephoto).toBe("");
  });

  test("TC_18: Sahi data aur valid profile photo ke sath successfully register hona chahiye (201 Created)", async () => {
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );

    const res = await request(app)
      .post("/register")
      .field("name", "Fresh User With Photo")
      .field("email", successEmail2)
      .field("password", testPassword)
      .field("gender", "male")
      .field("dob", "1993-11-10")
      .attach("profilephoto", pngBuffer, {
        filename: "valid-avatar.png",
        contentType: "image/png",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toContain("Registration successful");

    const created = await User.findOne({ email: successEmail2 });
    expect(created).toBeTruthy();
    expect(created.profilephoto).toBeTruthy();
    expect(created.profilephoto).toMatch(/\.png$/);
  });
});
