const request = require("supertest");
const {
  app,
  User,
  Session,
  prefix,
  ensureDb,
  makeUser,
  makeToken,
  cleanupUser,
} = require("./testUtils");

describe("DELETE /api/admin/users/:id", () => {
  let admin, token, target;
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      name: "Delete API Admin",
      email: `${prefix}_delete_admin@example.com`,
      role: "admin",
    });
    token = makeToken(admin);
  });
  beforeEach(async () => {
    target = await makeUser();
  });
  afterEach(async () => {
    if (target?._id) {
      await Session.deleteMany({ userId: target._id });
      await User.deleteOne({ _id: target._id });
    }
  });
  afterAll(async () => cleanupUser(admin));

  test("TC_01: token missing par 401", async () => {
    const res = await request(app).delete(`/api/admin/users/${target._id}`);
    expect(res.status).toBe(401);
  });
  test("TC_02: admin target user delete kar sake", async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${target._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("user deleted successfully");
    expect(await User.findById(target._id)).toBeNull();
  });
  test("TC_03: admin apna account delete nahi kar sake", async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${admin._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(await User.findById(admin._id)).not.toBeNull();
  });
  test("TC_04: invalid ID par controller error response de", async () => {
    const res = await request(app)
      .delete("/api/admin/users/not-an-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(500);
  });
  test("TC_05: non-existing valid ID par 404 Not Found milna chahiye", async () => {
    const res = await request(app)
      .delete("/api/admin/users/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});
