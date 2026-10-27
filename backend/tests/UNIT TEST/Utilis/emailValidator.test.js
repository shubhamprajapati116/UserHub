const mockResolveMx = jest.fn();
const mockResolve4 = jest.fn();
const mockSetServers = jest.fn();

jest.mock("dns", () => ({
  promises: {
    Resolver: jest.fn().mockImplementation(() => ({
      setServers: mockSetServers,
      resolveMx: mockResolveMx,
      resolve4: mockResolve4,
    })),
  },
}));

const {
  validateEmailDeliverability,
  DISPOSABLE_DOMAINS,
} = require("../../../utils/emailValidator");

describe("emailValidator Utility Unit Tests (utils/emailValidator.js)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Format Validation", () => {
    test("TC_01: Empty, null, undefined ya invalid email format hone par INVALID_FORMAT aana chahiye", async () => {
      const invalidEmails = [
        "",
        null,
        undefined,
        "not-an-email",
        "@missingusername.com",
        "username@.com",
        "user@domain",
        "user@domain.c", 
      ];

      for (const email of invalidEmails) {
        const result = await validateEmailDeliverability(email);
        expect(result.valid).toBe(false);
        expect(result.code).toBe("INVALID_FORMAT");
        expect(result.reason).toBe("Please enter a valid email address.");
      }
    });
  });

  describe("Disposable Email Domains", () => {
    test("TC_02: DISPOSABLE_DOMAINS set export hona chahiye aur popular disposable domains check hone chahiye", () => {
      expect(DISPOSABLE_DOMAINS).toBeInstanceOf(Set);
      expect(DISPOSABLE_DOMAINS.has("mailinator.com")).toBe(true);
      expect(DISPOSABLE_DOMAINS.has("yopmail.com")).toBe(true);
      expect(DISPOSABLE_DOMAINS.has("tempmail.com")).toBe(true);
    });

    test("TC_03: Disposable email address aane par DISPOSABLE code return hona chahiye aur DNS check skip hona chahiye", async () => {
      const result = await validateEmailDeliverability("fakeuser@mailinator.com");

      expect(result.valid).toBe(false);
      expect(result.code).toBe("DISPOSABLE");
      expect(result.reason).toContain("Temporary / disposable email addresses are not allowed");
      expect(mockResolveMx).not.toHaveBeenCalled();
    });
  });

  describe("Typo / Domain Suggestion (Levenshtein Distance)", () => {
    test("TC_04: Common provider typo (jaise gmai.com, yaho.com, hotmial.com) par suggestion milna chahiye", async () => {
      const notFoundErr = Object.assign(new Error("Domain not found"), { code: "ENOTFOUND" });
      mockResolveMx.mockRejectedValue(notFoundErr);
      mockResolve4.mockRejectedValue(notFoundErr);

      const result = await validateEmailDeliverability("rahul@gmai.com");

      expect(result.valid).toBe(false);
      expect(result.code).toBe("NO_MX");
      expect(result.suggestion).toBe("rahul@gmail.com");
      expect(result.reason).toContain('Did you mean rahul@gmail.com?');
    });
  });

  describe("DNS MX & A Record Deliverability", () => {
    test("TC_05: Domain ke valid MX records hone par valid: true, code: 'OK' return hona chahiye", async () => {
      mockResolveMx.mockResolvedValue([
        { exchange: "aspmx.l.google.com", priority: 1 },
        { exchange: "alt1.aspmx.l.google.com", priority: 5 },
      ]);

      const result = await validateEmailDeliverability("user@googlemail.com");

      expect(result.valid).toBe(true);
      expect(result.code).toBe("OK");
      expect(result.normalized).toBe("user@googlemail.com");
      expect(mockResolveMx).toHaveBeenCalledWith("googlemail.com");
    });

    test("TC_06: MX record na ho (ENODATA/ENOTFOUND) lekin A record (IPv4) mil jaaye to code: 'OK' return hona chahiye", async () => {
      const enodataErr = Object.assign(new Error("No MX record"), { code: "ENODATA" });
      mockResolveMx.mockRejectedValue(enodataErr);
      mockResolve4.mockResolvedValue(["93.184.216.34"]);

      const result = await validateEmailDeliverability("contact@customfallbackdomain.org");

      expect(result.valid).toBe(true);
      expect(result.code).toBe("OK");
      expect(mockResolve4).toHaveBeenCalledWith("customfallbackdomain.org");
    });

    test("TC_07: MX aur A dono na milne par (ENOTFOUND) valid: false aur code: 'NO_MX' return hona chahiye", async () => {
      const notFoundErr = Object.assign(new Error("Not found"), { code: "ENOTFOUND" });
      mockResolveMx.mockRejectedValue(notFoundErr);
      mockResolve4.mockRejectedValue(notFoundErr);

      const result = await validateEmailDeliverability("test@completelyfakenonexistentdomain999.org");

      expect(result.valid).toBe(false);
      expect(result.code).toBe("NO_MX");
      expect(result.reason).toContain('The domain "completelyfakenonexistentdomain999.org" does not exist');
    });

    test("TC_08: Network error (ETIMEOUT, ECONNREFUSED) aane par valid: true aur code: 'DNS_UNAVAILABLE' graceful fallback hona chahiye", async () => {
      const timeoutErr = Object.assign(new Error("DNS timeout"), { code: "ETIMEOUT" });
      mockResolveMx.mockRejectedValue(timeoutErr);

      const result = await validateEmailDeliverability("someone@slowdnsserverdomain.com");

      expect(result.valid).toBe(true);
      expect(result.code).toBe("DNS_UNAVAILABLE");
      expect(result.reason).toContain("Could not reach DNS to confirm the domain");
    });
  });
});
