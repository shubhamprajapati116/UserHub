jest.mock("../../utils/sendEmail", () => jest.fn().mockResolvedValue({}));
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

describe("POST /api/admin/users/:id/resend-pending-email", () => {
  let admin, target, token;
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      email: `${prefix}_resendmail_admin@example.com`,
      role: "admin",
    });
    token = makeToken(admin);
  });
  beforeEach(async () => {
    target = await makeUser({
      pendingEmail: `${prefix}_pending@example.com`,
      lastVerificationSentAt: null,
    });
  });
  afterEach(async () => cleanupUser(target));
  afterAll(async () => cleanupUser(admin));

  test("TC_01: missing token par 401", async () => {
    expect(
      (
        await request(app).post(
          `/api/admin/users/${target._id}/resend-pending-email`,
        )
      ).status,
    ).toBe(401);
  });
  test("TC_02: user not found par 404", async () => {
    expect(
      (
        await request(app)
          .post(
            "/api/admin/users/507f1f77bcf86cd799439011/resend-pending-email",
          )
          .set("Authorization", `Bearer ${token}`)
      ).status,
    ).toBe(404);
  });
  test("TC_03: pending email absent par 400", async () => {
    await User.updateOne({ _id: target._id }, { $set: { pendingEmail: null } });
    const res = await request(app)
      .post(`/api/admin/users/${target._id}/resend-pending-email`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
  test("TC_04: cooldown ke andar request par 429", async () => {
    await User.updateOne(
      { _id: target._id },
      { $set: { lastVerificationSentAt: new Date() } },
    );
    const res = await request(app)
      .post(`/api/admin/users/${target._id}/resend-pending-email`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(429);
  });
  test("TC_05: pending verification resend ho aur token expiry update ho", async () => {
    const res = await request(app)
      .post(`/api/admin/users/${target._id}/resend-pending-email`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("verification link has been sent");
    const updated = await User.findById(target._id);
    expect(updated.verificationToken).toBeTruthy();
    expect(updated.verificationTokenExpire.getTime()).toBeGreaterThan(
      Date.now(),
    );
    expect(updated.lastVerificationSentAt).toBeTruthy();
  });
});
