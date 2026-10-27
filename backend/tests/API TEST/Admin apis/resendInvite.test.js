jest.mock("../../../utils/sendEmail", () => jest.fn().mockResolvedValue({}));
const request = require("supertest");
const sendEmail = require("../../../utils/sendEmail");
const {
  app,
  User,
  prefix,
  ensureDb,
  makeUser,
  makeToken,
  cleanupUser,
} = require("./testUtils");

describe("POST /api/admin/users/:id/resend-invite", () => {
  let admin, target, token;
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      name: "Invite Resender Admin",
      email: `${prefix}_resendinvite_admin@example.com`,
      role: "admin",
    });
    token = makeToken(admin);
  });
  beforeEach(async () => {
    target = await makeUser({
      inviteStatus: "pending",
      accountSource: "admin_invited",
      lastInviteSentAt: null,
      inviteTokenHash: null,
      inviteTokenExpire: null,
    });
    sendEmail.mockClear();
    sendEmail.mockResolvedValue({});
  });
  afterEach(async () => cleanupUser(target));
  afterAll(async () => cleanupUser(admin));

  test("TC_01: token missing par 401", async () => {
    expect(
      (await request(app).post(`/api/admin/users/${target._id}/resend-invite`))
        .status,
    ).toBe(401);
  });
  test("TC_02: user not found par 404", async () => {
    expect(
      (
        await request(app)
          .post("/api/admin/users/507f1f77bcf86cd799439011/resend-invite")
          .set("Authorization", `Bearer ${token}`)
      ).status,
    ).toBe(404);
  });
  test("TC_03: non-pending invite par 400", async () => {
    await User.updateOne(
      { _id: target._id },
      { $set: { inviteStatus: "accepted" } },
    );
    const res = await request(app)
      .post(`/api/admin/users/${target._id}/resend-invite`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
  test("TC_04: cooldown ke andar resend par 429", async () => {
    await User.updateOne(
      { _id: target._id },
      { $set: { lastInviteSentAt: new Date() } },
    );
    const res = await request(app)
      .post(`/api/admin/users/${target._id}/resend-invite`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(429);
  });
  test("TC_05: pending invite resend ho aur hash/expiry update ho", async () => {
    const res = await request(app)
      .post(`/api/admin/users/${target._id}/resend-invite`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deliveryStatus).toBe("sent");
    const updated = await User.findById(target._id).select("+inviteTokenHash");
    expect(updated.inviteTokenHash).toBeTruthy();
    expect(updated.inviteTokenExpire.getTime()).toBeGreaterThan(Date.now());
    expect(updated.lastInviteSentAt).toBeTruthy();
    expect(updated.inviteDeliveryStatus).toBe("sent");
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
  test("TC_06: email send fail ho to failed delivery status save ho", async () => {
    sendEmail.mockRejectedValueOnce(new Error("SMTP unavailable"));
    const res = await request(app)
      .post(`/api/admin/users/${target._id}/resend-invite`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.deliveryStatus).toBe("failed");
    const updated = await User.findById(target._id);
    expect(updated.inviteDeliveryStatus).toBe("failed");
    expect(updated.inviteDeliveryError).toContain("SMTP unavailable");
  });
});
