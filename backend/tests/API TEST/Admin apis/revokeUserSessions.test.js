jest.mock("../../utils/sendEmail", () => jest.fn().mockResolvedValue({}));
const request = require("supertest");
const {
  app,
  Session,
  prefix,
  ensureDb,
  makeUser,
  makeToken,
  cleanupUser,
} = require("./testUtils");

describe("POST /api/admin/users/:id/revoke-session", () => {
  let admin, target, token;
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      email: `${prefix}_revoke_admin@example.com`,
      role: "admin",
    });
    token = makeToken(admin);
  });
  beforeEach(async () => {
    target = await makeUser({
      loginOtp: "123456",
      loginOtpExpire: new Date(Date.now() + 60000),
      trustedDevices: [{ deviceId: `device_${Date.now()}` }],
    });
  });
  afterEach(async () => cleanupUser(target));
  afterAll(async () => cleanupUser(admin));

  test("TC_01: token missing par 401", async () => {
    expect(
      (await request(app).post(`/api/admin/users/${target._id}/revoke-session`))
        .status,
    ).toBe(401);
  });
  test("TC_02: user not found par 404", async () => {
    const res = await request(app)
      .post("/api/admin/users/507f1f77bcf86cd799439011/revoke-session")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
  test("TC_03: pending invite ke sessions revoke nahi hone chahiye", async () => {
    target.inviteStatus = "pending";
    await target.save();
    const res = await request(app)
      .post(`/api/admin/users/${target._id}/revoke-session`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
  test("TC_04: sessions delete hon aur trusted devices/OTP clear hon", async () => {
    await Session.create({
      userId: target._id,
      sessionId: `${prefix}_session_${Date.now()}`,
      deviceId: `dev_${Date.now()}`,
      browser: "Chrome",
    });
    const res = await request(app)
      .post(`/api/admin/users/${target._id}/revoke-session`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.terminatedCount).toBe(1);
    const updated = await require("../../models/user").findById(target._id);
    expect(await Session.countDocuments({ userId: target._id })).toBe(0);
    expect(updated.loginOtp).toBeNull();
    expect(updated.loginOtpExpire).toBeNull();
    expect(updated.trustedDevices).toHaveLength(0);
  });
});
