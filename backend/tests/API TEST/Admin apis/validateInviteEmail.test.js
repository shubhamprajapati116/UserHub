jest.mock("../../utils/emailValidator", () => ({
  validateEmailDeliverability: jest.fn(),
}));
const request = require("supertest");
const { validateEmailDeliverability } = require("../../utils/emailValidator");
const {
  app,
  prefix,
  ensureDb,
  makeUser,
  makeToken,
  cleanupUser,
} = require("./testUtils");

describe("POST /api/admin/users/validate-email", () => {
  let admin, token;
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      email: `${prefix}_validate_admin@example.com`,
      role: "admin",
    });
    token = makeToken(admin);
  });
  afterAll(async () => cleanupUser(admin));
  beforeEach(() => jest.clearAllMocks());

  test("TC_01: token missing par 401", async () => {
    expect(
      (
        await request(app)
          .post("/api/admin/users/validate-email")
          .send({ email: "person@example.com" })
      ).status,
    ).toBe(401);
  });
  test("TC_02: email missing par 400 aur EMPTY code", async () => {
    const res = await request(app)
      .post("/api/admin/users/validate-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: " " });
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
    expect(res.body.code).toBe("EMPTY");
  });
  test("TC_03: already registered email duplicate bataye", async () => {
    const existing = await makeUser({
      email: `${prefix}_existing@example.com`,
    });
    validateEmailDeliverability.mockResolvedValue({
      valid: true,
      code: "VALID",
      reason: "Looks valid",
      suggestion: null,
    });
    const res = await request(app)
      .post("/api/admin/users/validate-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: existing.email.toUpperCase() });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.code).toBe("ALREADY_EXISTS");
    expect(res.body.exists).toBe(true);
    await cleanupUser(existing);
  });
  test("TC_04: valid new email deliverability result return kare", async () => {
    validateEmailDeliverability.mockResolvedValue({
      valid: true,
      code: "VALID",
      reason: "Deliverable",
      suggestion: null,
    });
    const res = await request(app)
      .post("/api/admin/users/validate-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "new-person@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.exists).toBe(false);
    expect(res.body.isPendingInvite).toBe(false);
  });
  test("TC_05: invalid deliverability result pass through ho", async () => {
    validateEmailDeliverability.mockResolvedValue({
      valid: false,
      code: "INVALID",
      reason: "Invalid domain",
      suggestion: null,
    });
    const res = await request(app)
      .post("/api/admin/users/validate-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "person@invalid-example.test" });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.code).toBe("INVALID");
  });
  test("TC_06: pending invite email already exists ke roop me detect ho", async () => {
    const invited = await makeUser({
      email: `${prefix}_invite_pending@example.com`,
      inviteStatus: "pending",
    });
    validateEmailDeliverability.mockResolvedValue({
      valid: true,
      code: "VALID",
      reason: "Valid",
      suggestion: null,
    });
    const res = await request(app)
      .post("/api/admin/users/validate-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: invited.email });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe("ALREADY_EXISTS");
    expect(res.body.isPendingInvite).toBe(true);
    await cleanupUser(invited);
  });
});
