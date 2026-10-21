const request = require("supertest");
const {
  app,
  prefix,
  ensureDb,
  makeUser,
  makeToken,
  cleanupUser,
} = require("./testUtils");

describe("GET Admin Stats APIs", () => {
  let admin, normal, adminToken, normalToken;
  beforeAll(async () => {
    await ensureDb();
    admin = await makeUser({
      email: `${prefix}_stats_admin@example.com`,
      role: "admin",
    });
    normal = await makeUser({ email: `${prefix}_stats_normal@example.com` });
    adminToken = makeToken(admin);
    normalToken = makeToken(normal);
  });
  afterAll(async () => {
    await cleanupUser(admin);
    await cleanupUser(normal);
  });

  test("TC_01: /api/admin/stats token missing par 401", async () => {
    expect((await request(app).get("/api/admin/stats")).status).toBe(401);
  });
  test("TC_02: normal user ko 403", async () => {
    expect(
      (
        await request(app)
          .get("/api/admin/stats")
          .set("Authorization", `Bearer ${normalToken}`)
      ).status,
    ).toBe(403);
  });
  test("TC_03: admin ko stats response mile", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.totalUsers).toBe("number");
    expect(res.body).toHaveProperty("stats");
  });
  test("TC_04: expected stat fields numeric hon", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    for (const field of [
      "totalUsers",
      "verifiedUsersCount",
      "adminUsersCount",
      "todayUsersCount",
      "maleUsersCount",
      "femaleUsersCount",
      "activeUsersCount",
      "unverifiedUsersCount",
      "securityVerifiedCount",
      "suspendedUsersCount",
      "bannedUsersCount",
      "pendingInvitesCount",
      "otherUsersCount",
    ]) {
      expect(typeof res.body.stats[field]).toBe("number");
      expect(res.body.stats[field]).toBeGreaterThanOrEqual(0);
    }
  });
  test("TC_05: /admin/stats alias bhi same stats response de", async () => {
    const res = await request(app)
      .get("/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("stats.totalUsers");
  });
});
