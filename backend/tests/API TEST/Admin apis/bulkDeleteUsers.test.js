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

describe("POST /api/admin/users/bulk-delete", () => {
  let admin,
    token,
    targets = [];
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      email: `${prefix}_bulkdelete_admin@example.com`,
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

  test("TC_01: token missing par 401", async () => {
    expect(
      (
        await request(app)
          .post("/api/admin/users/bulk-delete")
          .send({ userIds: [] })
      ).status,
    ).toBe(401);
  });
  test("TC_02: userIds missing par 400", async () => {
    const res = await request(app)
      .post("/api/admin/users/bulk-delete")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No user IDs provided");
  });
  test("TC_03: empty userIds par 400", async () => {
    const res = await request(app)
      .post("/api/admin/users/bulk-delete")
      .set("Authorization", `Bearer ${token}`)
      .send({ userIds: [] });
    expect(res.status).toBe(400);
  });
  test("TC_04: multiple users delete hon aur deletedCount correct ho", async () => {
    const ids = targets.map((u) => u._id.toString());
    const res = await request(app)
      .post("/api/admin/users/bulk-delete")
      .set("Authorization", `Bearer ${token}`)
      .send({ userIds: ids });
    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(2);
    expect(await User.countDocuments({ _id: { $in: ids } })).toBe(0);
  });
  test("TC_05: bulk delete me current admin ID protected rahe", async () => {
    const res = await request(app)
      .post("/api/admin/users/bulk-delete")
      .set("Authorization", `Bearer ${token}`)
      .send({ userIds: [admin._id.toString(), targets[0]._id.toString()] });
    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(1);
    expect(await User.findById(admin._id)).not.toBeNull();
    expect(await User.findById(targets[0]._id)).toBeNull();
  });
});
