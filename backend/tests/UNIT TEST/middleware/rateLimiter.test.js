let capturedConfigs = {};

jest.mock("express-rate-limit", () => {
  return jest.fn((config) => {
    const middleware = jest.fn((req, res, next) => {
      if (next) next();
    });
    middleware.options = config;
    return middleware;
  });
});

const rateLimiters = require("../../../middleware/rateLimiter");

describe("Rate Limiter Middleware Unit Tests (middleware/rateLimiter.js)", () => {
  const {
    authLimiter,
    emailLimiter,
    registerLimiter,
    userApiLimiter,
    globalLimiter,
    notificationLimiter,
  } = rateLimiters;

  test("TC_01: Sabhi limiters export hone chahiye aur express middleware functions hone chahiye", () => {
    expect(typeof authLimiter).toBe("function");
    expect(typeof emailLimiter).toBe("function");
    expect(typeof registerLimiter).toBe("function");
    expect(typeof userApiLimiter).toBe("function");
    expect(typeof globalLimiter).toBe("function");
    expect(typeof notificationLimiter).toBe("function");
  });

  describe("getClientIp helper & IP detection", () => {
    test("TC_02: x-forwarded-for header hone par pehla IP trim karke lena chahiye", () => {
      const keyGen = globalLimiter.options.keyGenerator;
      const req = {
        headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
      };
      expect(keyGen(req)).toBe("203.0.113.195");
    });

    test("TC_03: x-forwarded-for na hone par socket.remoteAddress lena chahiye", () => {
      const keyGen = globalLimiter.options.keyGenerator;
      const req = {
        headers: {},
        socket: { remoteAddress: "192.168.1.50" },
      };
      expect(keyGen(req)).toBe("192.168.1.50");
    });

    test("TC_04: socket na hone par req.ip lena chahiye, aur sabhi missing hone par '127.0.0.1' fallback hona chahiye", () => {
      const keyGen = globalLimiter.options.keyGenerator;
      expect(keyGen({ headers: {}, ip: "10.0.0.1" })).toBe("10.0.0.1");
      expect(keyGen({ headers: {} })).toBe("127.0.0.1");
    });
  });

  describe("authLimiter keyGenerator & config", () => {
    test("TC_05: authLimiter me email body me ho to IP_email key banni chahiye (lowercase & trimmed)", () => {
      const keyGen = authLimiter.options.keyGenerator;
      const req = {
        headers: {},
        ip: "1.2.3.4",
        body: { email: "  User@Example.Com  " },
      };
      expect(keyGen(req)).toBe("1.2.3.4_user@example.com");
    });

    test("TC_06: authLimiter me email query me ho to IP_email key banni chahiye", () => {
      const keyGen = authLimiter.options.keyGenerator;
      const req = {
        headers: {},
        ip: "1.2.3.4",
        query: { email: "query@example.com" },
      };
      expect(keyGen(req)).toBe("1.2.3.4_query@example.com");
    });

    test("TC_07: authLimiter me email na ho to sirf IP key banni chahiye", () => {
      const keyGen = authLimiter.options.keyGenerator;
      const req = {
        headers: {},
        ip: "1.2.3.4",
        body: {},
      };
      expect(keyGen(req)).toBe("1.2.3.4");
    });

    test("TC_08: authLimiter options windowMs=15min, max=5 aur skipSuccessfulRequests=true hone chahiye", () => {
      expect(authLimiter.options.windowMs).toBe(15 * 60 * 1000);
      expect(authLimiter.options.max).toBe(5);
      expect(authLimiter.options.skipSuccessfulRequests).toBe(true);
      expect(authLimiter.options.message.success).toBe(false);
    });
  });

  describe("emailLimiter keyGenerator & config", () => {
    test("TC_09: emailLimiter me email hone par IP_email aur na hone par sirf IP key banni chahiye", () => {
      const keyGen = emailLimiter.options.keyGenerator;
      expect(keyGen({ headers: {}, ip: "5.6.7.8", body: { email: "test@domain.com" } })).toBe("5.6.7.8_test@domain.com");
      expect(keyGen({ headers: {}, ip: "5.6.7.8" })).toBe("5.6.7.8");
    });

    test("TC_10: emailLimiter windowMs 1 hour aur max 5 hona chahiye", () => {
      expect(emailLimiter.options.windowMs).toBe(60 * 60 * 1000);
      expect(emailLimiter.options.max).toBe(5);
    });
  });

  describe("userApiLimiter keyGenerator", () => {
    test("TC_11: req.user.id ya req.user._id hone par user_{id} key banni chahiye", () => {
      const keyGen = userApiLimiter.options.keyGenerator;
      expect(keyGen({ user: { id: "usr_abc123" } })).toBe("user_usr_abc123");
      expect(keyGen({ user: { _id: "usr_xyz789" } })).toBe("user_usr_xyz789");
    });

    test("TC_12: req.user na hone par client IP fallback hona chahiye", () => {
      const keyGen = userApiLimiter.options.keyGenerator;
      expect(keyGen({ headers: {}, ip: "11.22.33.44" })).toBe("11.22.33.44");
    });
  });

  describe("notificationLimiter keyGenerator", () => {
    test("TC_13: req.user hone par notif_{id} key banni chahiye", () => {
      const keyGen = notificationLimiter.options.keyGenerator;
      expect(keyGen({ user: { id: "usr_notif" } })).toBe("notif_usr_notif");
      expect(keyGen({ user: { _id: "usr_notif_mongo" } })).toBe("notif_usr_notif_mongo");
    });

    test("TC_14: req.user na hone par client IP fallback hona chahiye", () => {
      const keyGen = notificationLimiter.options.keyGenerator;
      expect(keyGen({ headers: {}, ip: "99.88.77.66" })).toBe("99.88.77.66");
    });
  });
});
