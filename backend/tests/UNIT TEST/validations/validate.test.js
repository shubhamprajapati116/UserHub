const {
  userSchema,
  loginschema,
  updateUserSchema,
  changePasswordValidation,
  inviteUserSchema,
  acceptInviteSchema,
} = require("../../../validations/validate");

describe("Joi Validations Unit Tests - Unique Schema Edge Cases Only", () => {
  describe("1. userSchema (Unique Cases)", () => {
    const validUser = {
      name: "  Rahul Sharma  ",
      email: "  rahul@gmail.com  ",
      password: "Password123",
      dob: "2000-05-15",
      gender: "male",
    };

    test("TC_01: name aur email ke aage-peeche ke spaces .trim() se clean hone chahiye aur profilephoto null/empty allow hona chahiye", () => {
      const { error, value } = userSchema.validate({
        ...validUser,
        profilephoto: null,
      });
      expect(error).toBeUndefined();
      expect(value.name).toBe("Rahul Sharma");
      expect(value.email).toBe("rahul@gmail.com");
    });

    test("TC_02: Registration me extra unknown field (jaise role: 'admin') reject hona chahiye", () => {
      const { error } = userSchema.validate({
        ...validUser,
        role: "admin",
      });
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe("role");
    });
  });

  describe("2. loginschema (Unique Cases)", () => {
    test("TC_03: deviceId empty string ('') allow hona chahiye aur email .trim() hona chahiye", () => {
      const { error, value } = loginschema.validate({
        email: "   user@gmail.com   ",
        password: "Password123",
        deviceId: "",
      });
      expect(error).toBeUndefined();
      expect(value.email).toBe("user@gmail.com");
    });

    test("TC_04: Login payload me extra unknown field (jaise role) reject hona chahiye", () => {
      const { error } = loginschema.validate({
        email: "user@gmail.com",
        password: "Password123",
        role: "admin",
      });
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe("role");
    });
  });

  describe("3. updateUserSchema (Unique Cases)", () => {
    const validUpdate = {
      name: "Rahul Updated",
      email: "rahul@gmail.com",
      dob: "2000-05-15",
      gender: "male",
    };

    test("TC_05: Invalid Indian phone number (5 se start ya <10 digits) par custom error message aana chahiye", () => {
      const res1 = updateUserSchema.validate({
        ...validUpdate,
        phone: "5123456789",
      });
      const res2 = updateUserSchema.validate({
        ...validUpdate,
        phone: "98765",
      });

      expect(res1.error).toBeDefined();
      expect(res1.error.details[0].message).toBe(
        "Please enter a valid 10-digit mobile number",
      );
      expect(res2.error).toBeDefined();
    });

    test("TC_06: Bio (>500 chars) aur country/state/city (>100 chars) limit cross hone par reject hona chahiye", () => {
      expect(
        updateUserSchema.validate({ ...validUpdate, bio: "a".repeat(501) })
          .error,
      ).toBeDefined();
      expect(
        updateUserSchema.validate({ ...validUpdate, country: "a".repeat(101) })
          .error,
      ).toBeDefined();
      expect(
        updateUserSchema.validate({ ...validUpdate, state: "a".repeat(101) })
          .error,
      ).toBeDefined();
      expect(
        updateUserSchema.validate({ ...validUpdate, city: "a".repeat(101) })
          .error,
      ).toBeDefined();
    });

    test("TC_07: .unknown(true) ki wajah se extra fields allow hone chahiye", () => {
      const { error } = updateUserSchema.validate({
        ...validUpdate,
        customExtraField: "allowed_value",
      });
      expect(error).toBeUndefined();
    });
  });

  describe("4. changePasswordValidation (Unique Cases)", () => {
    test("TC_08: Empty string ('') currentPassword ya newPassword par custom string.empty message aana chahiye", () => {
      const res1 = changePasswordValidation({
        currentPassword: "",
        newPassword: "NewPassword123",
      });
      const res2 = changePasswordValidation({
        currentPassword: "OldPassword123",
        newPassword: "",
      });

      expect(res1.error.details[0].message).toBe(
        "Current password is required",
      );
      expect(res2.error.details[0].message).toBe("New password is required");
    });

    test("TC_09: Extra unknown field bhejne par reject hona chahiye", () => {
      const { error } = changePasswordValidation({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
        extraField: "not-allowed",
      });
      expect(error).toBeDefined();
    });
  });

  describe("5. inviteUserSchema (Unique Cases)", () => {
    const validInvite = {
      name: "Invited User",
      email: "invite@gmail.com",
      dob: "1998-10-10",
      gender: "female",
    };

    test("TC_10: Name <3 chars ya >50 chars hone par exact custom error messages aane chahiye", () => {
      const minRes = inviteUserSchema.validate({ ...validInvite, name: "Ab" });
      const maxRes = inviteUserSchema.validate({
        ...validInvite,
        name: "a".repeat(51),
      });

      expect(minRes.error.details[0].message).toBe(
        "Full name must be at least 3 characters",
      );
      expect(maxRes.error.details[0].message).toBe(
        "Full name cannot exceed 50 characters",
      );
    });

    test("TC_11: Invite payload me password field bhejne par reject hona chahiye", () => {
      const { error } = inviteUserSchema.validate({
        ...validInvite,
        password: "Password123",
      });
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe("password");
    });
  });

  describe("6. acceptInviteSchema (Unique Cases)", () => {
    test("TC_12: confirmPassword optional hai, sirf valid password bhejne par bhi pass hona chahiye", () => {
      const { error } = acceptInviteSchema.validate({
        password: "StrongPassword123",
      });
      expect(error).toBeUndefined();
    });
  });
});
