const request = require("supertest");
const {
  app,
  User,
  prefix,
  ensureDb,
  makeUser,
  makeToken,
  cleanupUser,
} = require("./testUtils");

describe("GET /api/admin/users/:id", () => {
  let admin, target, token;
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      name: "Get By ID Admin",
      email: `${prefix}_getbyid_admin@example.com`,
      role: "admin",
    });
    token = makeToken(admin);
  });
  beforeEach(async () => {
    target = await makeUser({
      name: "Target Detail User",
      resetPasswordToken: "secret-reset-token",
      resetPasswordExpire: new Date(),
    });
  });
  afterEach(async () => cleanupUser(target));
  afterAll(async () => cleanupUser(admin));

  test("TC_01: token missing par 401", async () => {
    const res = await request(app).get(`/api/admin/users/${target._id}`);
    expect(res.status).toBe(401);
  });
  test("TC_02: admin user details fetch kar sake", async () => {
    const res = await request(app)
      .get(`/api/admin/users/${target._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(target._id.toString());
    expect(res.body.email).toBe(target.email);
  });
  test("TC_03: password aur reset token expose nahi hone chahiye", async () => {
    const res = await request(app)
      .get(`/api/admin/users/${target._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("password");
    expect(res.body).not.toHaveProperty("resetPasswordToken");
    expect(res.body).not.toHaveProperty("resetPasswordExpire");
  });
  test("TC_04: missing user par 404", async () => {
    const id = "507f1f77bcf86cd799439011";
    const res = await request(app)
      .get(`/api/admin/users/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
  test("TC_05: invalid Mongo ID controller error handling verify kare", async () => {
    const res = await request(app)
      .get("/api/admin/users/not-an-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(500);
  });
});
