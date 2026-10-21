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

describe("PUT /api/admin/users/:id/role", () => {
  let admin, token, target;
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      email: `${prefix}_makeadmin_admin@example.com`,
      role: "admin",
    });
    token = makeToken(admin);
  });
  beforeEach(async () => {
    target = await makeUser();
  });
  afterEach(async () => cleanupUser(target));
  afterAll(async () => cleanupUser(admin));

  test("TC_01: token missing par 401", async () => {
    expect(
      (await request(app).put(`/api/admin/users/${target._id}/role`)).status,
    ).toBe(401);
  });
  test("TC_02: user ko admin promote kar sake", async () => {
    const res = await request(app)
      .put(`/api/admin/users/${target._id}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User promoted to admin");
    expect((await User.findById(target._id)).role).toBe("admin");
  });
  test("TC_03: already-admin user par 400", async () => {
    await User.updateOne({ _id: target._id }, { $set: { role: "admin" } });
    const res = await request(app)
      .put(`/api/admin/users/${target._id}/role`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User is already an admin");
  });
  test("TC_04: pending invitation wale user ko promote nahi karna chahiye", async () => {
    await User.updateOne(
      { _id: target._id },
      { $set: { inviteStatus: "pending" } },
    );
    const res = await request(app)
      .put(`/api/admin/users/${target._id}/role`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect((await User.findById(target._id)).role).toBe("user");
  });
  test("TC_05: user not found par 404", async () => {
    const res = await request(app)
      .put("/api/admin/users/507f1f77bcf86cd799439011/role")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
