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

describe("DELETE /api/admin/users/:id/invite", () => {
  let admin, target, token;
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      email: `${prefix}_cancelinvite_admin@example.com`,
      role: "admin",
    });
    token = makeToken(admin);
  });
  beforeEach(async () => {
    target = await makeUser({
      inviteStatus: "pending",
      accountSource: "admin_invited",
    });
  });
  afterEach(async () => cleanupUser(target));
  afterAll(async () => cleanupUser(admin));

  test("TC_01: token missing par 401", async () => {
    expect(
      (await request(app).delete(`/api/admin/users/${target._id}/invite`))
        .status,
    ).toBe(401);
  });
  test("TC_02: user not found par 404", async () => {
    expect(
      (
        await request(app)
          .delete("/api/admin/users/507f1f77bcf86cd799439011/invite")
          .set("Authorization", `Bearer ${token}`)
      ).status,
    ).toBe(404);
  });
  test("TC_03: accepted invitation cancel nahi honi chahiye", async () => {
    await User.updateOne(
      { _id: target._id },
      { $set: { inviteStatus: "accepted" } },
    );
    const res = await request(app)
      .delete(`/api/admin/users/${target._id}/invite`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(await User.findById(target._id)).not.toBeNull();
  });
  test("TC_04: pending invite cancel karke user delete ho", async () => {
    const id = target._id;
    const res = await request(app)
      .delete(`/api/admin/users/${id}/invite`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("has been cancelled and removed");
    expect(await User.findById(id)).toBeNull();
  });
});
