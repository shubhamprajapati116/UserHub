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

describe("PUT /api/admin/users/bulk-role", () => {
  let admin,
    token,
    targets = [];
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      email: `${prefix}_bulkrole_admin@example.com`,
      role: "admin",
    });
    token = makeToken(admin);
  });
  beforeEach(async () => {
    targets = [await makeUser(), await makeUser()];
  });
  afterEach(async () => {
    for (const u of targets) await cleanupUser(u);
  });
  afterAll(async () => cleanupUser(admin));

  test("TC_01: missing token par 401", async () => {
    expect(
      (
        await request(app)
          .put("/api/admin/users/bulk-role")
          .send({ userIds: [] })
      ).status,
    ).toBe(401);
  });
  test("TC_02: userIds missing par 400", async () => {
    const res = await request(app)
      .put("/api/admin/users/bulk-role")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin" });
    expect(res.status).toBe(400);
  });
  test("TC_03: empty userIds par 400", async () => {
    const res = await request(app)
      .put("/api/admin/users/bulk-role")
      .set("Authorization", `Bearer ${token}`)
      .send({ userIds: [], role: "admin" });
    expect(res.status).toBe(400);
  });
  test("TC_04: invalid role par 400", async () => {
    const res = await request(app)
      .put("/api/admin/users/bulk-role")
      .set("Authorization", `Bearer ${token}`)
      .send({ userIds: [targets[0]._id], role: "superadmin" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid role specified");
  });
  test("TC_05: multiple users ka role admin update ho", async () => {
    const ids = targets.map((u) => u._id.toString());
    const res = await request(app)
      .put("/api/admin/users/bulk-role")
      .set("Authorization", `Bearer ${token}`)
      .send({ userIds: ids, role: "admin" });
    expect(res.status).toBe(200);
    expect(res.body.modifiedCount).toBe(2);
    const updated = await User.find({ _id: { $in: ids } });
    expect(updated.every((u) => u.role === "admin")).toBe(true);
  });
  test("TC_06: current admin role change se excluded rahe", async () => {
    const res = await request(app)
      .put("/api/admin/users/bulk-role")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userIds: [admin._id.toString(), targets[0]._id.toString()],
        role: "user",
      });
    expect(res.status).toBe(200);
    expect((await User.findById(admin._id)).role).toBe("admin");
    expect((await User.findById(targets[0]._id)).role).toBe("user");
  });
});
