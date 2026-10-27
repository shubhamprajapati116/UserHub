const {
  userSchema,
  loginschema,
  updateUserSchema,
  changePasswordValidation,
  inviteUserSchema,
  acceptInviteSchema,
} = require("../../../validations/validate");

describe("Joi Validations Unit Tests (validations/validate.js)", () => {

  describe("1. userSchema", () => {
    const validUser = {
      name: "  Rahul Sharma  ",
      email: "  rahul@gmail.com  ",
      password: "Password123",
      dob: "2000-05-15",
      gender: "male",
    };

    test("TC_01: Valid user input accept hona chahiye, .trim() kaam karna chahiye aur optional profilephoto allow hona chahiye", () => {
      const { error, value } = userSchema.validate({
        ...validUser,
        profilephoto: null,
      });
      expect(error).toBeUndefined();
      expect(value.name).toBe("Rahul Sharma");
      expect(value.email).toBe("rahul@gmail.com");
    });

    test("TC_02: Required fields (name, email, password, dob, gender) missing hone par reject hona chahiye", () => {
      for (const field of ["name", "email", "password", "dob", "gender"]) {
        const payload = { ...validUser };
        delete payload[field];
        const { error } = userSchema.validate(payload);
        expect(error).toBeDefined();
        expect(error.details[0].path[0]).toBe(field);
      }
    });

    test("TC_03: Name min (3) aur max (50) boundaries check honi chahiye", () => {
      const tooShort = userSchema.validate({ ...validUser, name: "Ab" });
      const exactMin = userSchema.validate({ ...validUser, name: "abc" });
      const exactMax = userSchema.validate({
        ...validUser,
        name: "a".repeat(50),
      });
      const tooLong = userSchema.validate({
        ...validUser,
        name: "a".repeat(51),
      });

      expect(tooShort.error).toBeDefined();
      expect(exactMin.error).toBeUndefined();
      expect(exactMax.error).toBeUndefined();
      expect(tooLong.error).toBeDefined();
    });

    test("TC_04: Password minimum boundary (8 chars) check honi chahiye", () => {
      const tooShort = userSchema.validate({
        ...validUser,
        password: "1234567",
      });
      const exactMin = userSchema.validate({
        ...validUser,
        password: "12345678",
      });

      expect(tooShort.error).toBeDefined();
      expect(exactMin.error).toBeUndefined();
    });

    test("TC_05: Invalid email, invalid dob aur invalid gender formats reject hone chahiye", () => {
      expect(
        userSchema.validate({ ...validUser, email: "not-an-email" }).error,
      ).toBeDefined();
      expect(
        userSchema.validate({ ...validUser, dob: "invalid-date" }).error,
      ).toBeDefined();
      expect(
        userSchema.validate({ ...validUser, gender: "invalid-gender" }).error,
      ).toBeDefined();
    });

    test("TC_06: Unknown fields (jaise role: 'admin') reject hone chahiye", () => {
      const { error } = userSchema.validate({
        ...validUser,
        role: "admin",
      });
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe("role");
    });
  });


  describe("2. loginschema", () => {
    test("TC_07: Valid login input (with & without optional deviceId) accept hona chahiye", () => {
      expect(
        loginschema.validate({
          email: "  user@gmail.com  ",
          password: "Password123",
          deviceId: "dev-1",
        }).error,
      ).toBeUndefined();

      expect(
        loginschema.validate({
          email: "user@gmail.com",
          password: "Password123",
          deviceId: "",
        }).error,
      ).toBeUndefined();
    });

    test("TC_08: Required fields (email, password) missing ya empty hone par reject hona chahiye", () => {
      expect(
        loginschema.validate({ password: "Password123" }).error,
      ).toBeDefined();
      expect(
        loginschema.validate({ email: "user@gmail.com" }).error,
      ).toBeDefined();
      expect(
        loginschema.validate({ email: "", password: "Password123" }).error,
      ).toBeDefined();
      expect(
        loginschema.validate({ email: "user@gmail.com", password: "" }).error,
      ).toBeDefined();
    });

    test("TC_09: Invalid email format reject hona chahiye", () => {
      const { error } = loginschema.validate({
        email: "invalid-email-format",
        password: "Password123",
      });
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe("email");
    });

    test("TC_10: Unknown fields (jaise role) reject hone chahiye", () => {
      const { error } = loginschema.validate({
        email: "user@gmail.com",
        password: "Password123",
        role: "admin",
      });
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe("role");
    });
  });


  describe("3. updateUserSchema", () => {
    const validUpdate = {
      name: "Rahul Updated",
      email: "rahul@gmail.com",
      dob: "2000-05-15",
      gender: "male",
      phone: "9876543210",
      bio: "Full stack developer",
      country: "India",
      state: "Gujarat",
      city: "Surat",
    };

    test("TC_11: Valid update input aur empty optional fields accept hone chahiye", () => {
      expect(updateUserSchema.validate(validUpdate).error).toBeUndefined();
      expect(
        updateUserSchema.validate({
          ...validUpdate,
          phone: "",
          bio: "",
          country: "",
          state: "",
          city: "",
        }).error,
      ).toBeUndefined();
    });

    test("TC_12: Required fields (name, email, dob, gender) missing hone par reject hona chahiye", () => {
      for (const field of ["name", "email", "dob", "gender"]) {
        const payload = { ...validUpdate };
        delete payload[field];
        const { error } = updateUserSchema.validate(payload);
        expect(error).toBeDefined();
        expect(error.details[0].path[0]).toBe(field);
      }
    });

    test("TC_13: Invalid email, invalid phone regex aur invalid gender reject hone chahiye", () => {
      expect(
        updateUserSchema.validate({ ...validUpdate, email: "bad-email" }).error,
      ).toBeDefined();

      const badPhone = updateUserSchema.validate({
        ...validUpdate,
        phone: "5123456789",
      });
      expect(badPhone.error).toBeDefined();
      expect(badPhone.error.details[0].message).toBe(
        "Please enter a valid 10-digit mobile number",
      );

      expect(
        updateUserSchema.validate({ ...validUpdate, gender: "invalid" }).error,
      ).toBeDefined();
    });

    test("TC_14: Name (3..50), Bio (max 500), aur Country/State/City (max 100) boundaries check honi chahiye", () => {
      expect(
        updateUserSchema.validate({ ...validUpdate, name: "Ab" }).error,
      ).toBeDefined();
      expect(
        updateUserSchema.validate({ ...validUpdate, name: "a".repeat(51) })
          .error,
      ).toBeDefined();
      expect(
        updateUserSchema.validate({ ...validUpdate, bio: "a".repeat(501) })
          .error,
      ).toBeDefined();
      expect(
        updateUserSchema.validate({ ...validUpdate, city: "a".repeat(101) })
          .error,
      ).toBeDefined();
    });

    test("TC_15: .unknown(true) ki wajah se unknown extra fields allow hone chahiye", () => {
      const { error } = updateUserSchema.validate({
        ...validUpdate,
        customExtraField: "allowed_value",
      });
      expect(error).toBeUndefined();
    });
  });


  describe("4. changePasswordValidation", () => {
    test("TC_16: Valid currentPassword aur newPassword accept hona chahiye", () => {
      const { error } = changePasswordValidation({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
      });
      expect(error).toBeUndefined();
    });

    test("TC_17: Required fields (currentPassword, newPassword) missing ya empty hone par custom messages aane chahiye", () => {
      expect(
        changePasswordValidation({ newPassword: "NewPassword123" }).error
          .details[0].message,
      ).toBe("Current password is required");

      expect(
        changePasswordValidation({
          currentPassword: "",
          newPassword: "NewPassword123",
        }).error.details[0].message,
      ).toBe("Current password is required");

      expect(
        changePasswordValidation({ currentPassword: "OldPassword123" }).error
          .details[0].message,
      ).toBe("New password is required");

      expect(
        changePasswordValidation({
          currentPassword: "OldPassword123",
          newPassword: "",
        }).error.details[0].message,
      ).toBe("New password is required");
    });

    test("TC_18: newPassword minimum boundary (8 chars) check honi chahiye", () => {
      const shortRes = changePasswordValidation({
        currentPassword: "OldPassword123",
        newPassword: "1234567",
      });
      expect(shortRes.error).toBeDefined();
      expect(shortRes.error.details[0].message).toBe(
        "Password must be at least 8 characters",
      );
    });

    test("TC_19: Unknown fields reject hone chahiye", () => {
      const { error } = changePasswordValidation({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
        extraField: "not-allowed",
      });
      expect(error).toBeDefined();
    });
  });


  describe("5. inviteUserSchema", () => {
    const validInvite = {
      name: "Invited User",
      email: "invite@gmail.com",
      dob: "1998-10-10",
      gender: "female",
    };

    test("TC_20: Valid invite payload accept hona chahiye", () => {
      expect(inviteUserSchema.validate(validInvite).error).toBeUndefined();
    });

    test("TC_21: Required fields (name, email, dob, gender) missing ya empty hone par custom messages aane chahiye", () => {
      expect(
        inviteUserSchema.validate({ ...validInvite, name: "" }).error.details[0]
          .message,
      ).toBe("Full name is required");

      expect(
        inviteUserSchema.validate({ ...validInvite, email: "" }).error
          .details[0].message,
      ).toBe("Email is required");

      const { dob, ...noDob } = validInvite;
      expect(inviteUserSchema.validate(noDob).error.details[0].message).toBe(
        "Date of birth is required",
      );

      const { gender, ...noGender } = validInvite;
      expect(inviteUserSchema.validate(noGender).error.details[0].message).toBe(
        "Gender is required",
      );
    });

    test("TC_22: Name min (3) aur max (50) boundaries par custom messages aane chahiye", () => {
      expect(
        inviteUserSchema.validate({ ...validInvite, name: "Ab" }).error
          .details[0].message,
      ).toBe("Full name must be at least 3 characters");

      expect(
        inviteUserSchema.validate({ ...validInvite, name: "a".repeat(51) })
          .error.details[0].message,
      ).toBe("Full name cannot exceed 50 characters");
    });

    test("TC_23: Invalid email aur invalid gender formats par custom messages aane chahiye", () => {
      expect(
        inviteUserSchema.validate({ ...validInvite, email: "bad-email" }).error
          .details[0].message,
      ).toBe("Please enter a valid email address");

      expect(
        inviteUserSchema.validate({ ...validInvite, gender: "invalid" }).error
          .details[0].message,
      ).toBe("Please select a valid gender");
    });

    test("TC_24: Unknown fields (role, password) reject hone chahiye", () => {
      expect(
        inviteUserSchema.validate({ ...validInvite, role: "admin" }).error,
      ).toBeDefined();
      expect(
        inviteUserSchema.validate({ ...validInvite, password: "Password123" })
          .error,
      ).toBeDefined();
    });
  });

  describe("6. acceptInviteSchema", () => {
    test("TC_25: Valid matching password aur confirmPassword (ya optional omitted confirmPassword) accept hona chahiye", () => {
      expect(
        acceptInviteSchema.validate({
          password: "StrongPassword123",
          confirmPassword: "StrongPassword123",
        }).error,
      ).toBeUndefined();

      expect(
        acceptInviteSchema.validate({
          password: "StrongPassword123",
        }).error,
      ).toBeUndefined();
    });

    test("TC_26: Password missing, empty ya <8 chars boundary par custom error messages aane chahiye", () => {
      expect(acceptInviteSchema.validate({}).error.details[0].message).toBe(
        "Password is required",
      );
      expect(
        acceptInviteSchema.validate({ password: "" }).error.details[0].message,
      ).toBe("Password is required");
      expect(
        acceptInviteSchema.validate({ password: "1234567" }).error.details[0]
          .message,
      ).toBe("Password must be at least 8 characters");
    });

    test("TC_27: Password confirmation mismatch hone par 'Passwords do not match' aana chahiye", () => {
      const { error } = acceptInviteSchema.validate({
        password: "StrongPassword123",
        confirmPassword: "MismatchPassword123",
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe("Passwords do not match");
    });

    test("TC_28: Unknown fields reject hone chahiye", () => {
      const { error } = acceptInviteSchema.validate({
        password: "StrongPassword123",
        role: "admin",
      });
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe("role");
    });
  });
});
