// backend/docs/paths/auth.docs.js

module.exports = {
  "/login": {
    post: {
      tags: ["Auth"],
      summary: "Login with email and password",
      description:
        "Authenticates user credentials. If the deviceId is recognized, returns a JWT token and user details. If the device is unrecognized, triggers a 6-digit login OTP email.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/LoginInput",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful or OTP verification required",
          content: {
            "application/json": {
              examples: {
                trustedDeviceLogin: {
                  summary: "Trusted device (Direct JWT Login)",
                  value: {
                    message: "Login Successfully",
                    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    role: "user",
                    user: {
                      _id: "665f1b2c3d4e5f6a7b8c9d0e",
                      name: "Rahul Sharma",
                      email: "user@example.com",
                      role: "user",
                      status: "active",
                      isVerified: true,
                    },
                  },
                },
                newDeviceOtpRequired: {
                  summary: "Unrecognized device (OTP Required)",
                  value: {
                    requireOtp: true,
                    message:
                      "Unrecognized device detected. A 6-digit OTP has been sent to your email.",
                    email: "user@example.com",
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Validation error, Invalid Email, or Wrong Password",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                field: "password",
                message:
                  "Invalid password. You have 4 attempt(s) left before account lockout.",
                remainingAttempts: 4,
              },
            },
          },
        },
        403: {
          description:
            "Account locked, suspended, banned, pending invite, or unverified email",
          content: {
            "application/json": {
              examples: {
                unverified: {
                  summary: "Email not verified",
                  value: {
                    field: "email",
                    isUnverified: true,
                    email: "user@example.com",
                    message:
                      "Please verify your email address before logging in.",
                  },
                },
                locked: {
                  summary: "Account temporarily locked",
                  value: {
                    field: "email",
                    isLocked: true,
                    remainingMinutes: 15,
                    message:
                      "Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minute(s).",
                  },
                },
              },
            },
          },
        },
        429: {
          description: "Too many failed login attempts (authLimiter)",
          content: {
            "application/json": {
              example: {
                success: false,
                message:
                  "Too many failed attempts for this account from your network. Please try again after 15 minutes.",
              },
            },
          },
        },
      },
    },
  },
};