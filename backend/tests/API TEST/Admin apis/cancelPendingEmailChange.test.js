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

describe("DELETE /api/admin/users/:id/pending-email", () => {
  let admin, target, token;
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      email: `${prefix}_cancelmail_admin@example.com`,
      role: "admin",
    });
    token = makeToken(admin);
  });
  beforeEach(async () => {
    target = await makeUser({
      pendingEmail: `${prefix}_newmail@example.com`,
      verificationToken: "verify-secret",
      emailChangeOtp: "123456",
      emailChangeOtpExpire: new Date(Date.now() + 60000),
    });
  });
  afterEach(async () => cleanupUser(target));
  afterAll(async () => cleanupUser(admin));

  test("TC_01: missing token par 401", async () => {
    expect(
      (
        await request(app).delete(
          `/api/admin/users/${target._id}/pending-email`,
        )
      ).status,
    ).toBe(401);
  });
  test("TC_02: user not found par 404", async () => {
    expect(
      (
        await request(app)
          .delete("/api/admin/users/507f1f77bcf86cd799439011/pending-email")
          .set("Authorization", `Bearer ${token}`)
      ).status,
    ).toBe(404);
  });
  test("TC_03: pending email missing par 400", async () => {
    await User.updateOne({ _id: target._id }, { $set: { pendingEmail: null } });
    const res = await request(app)
      .delete(`/api/admin/users/${target._id}/pending-email`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
  test("TC_04: pending email change cancel ho aur OTP/token clear ho", async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${target._id}/pending-email`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("has been cancelled");
    const updated = await User.findById(target._id);
    expect(updated.pendingEmail).toBeNull();
    expect(updated.emailChangeOtp).toBeNull();
    expect(updated.emailChangeOtpExpire).toBeNull();
    expect(updated.verificationToken).toBeUndefined();
  });
});
