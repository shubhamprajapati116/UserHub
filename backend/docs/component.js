// backend/docs/component.js

module.exports = {
  LoginInput: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "user@example.com",
      },
      password: {
        type: "string",
        example: "Password123!",
      },
      deviceId: {
        type: "string",
        description: "Optional trusted device ID",
        example: "dev_abc123",
      },
    },
  },

  ErrorResponse: {
    type: "object",
    properties: {
      field: {
        type: "string",
        example: "email",
      },
      message: {
        type: "string",
        example: "Invalid Email",
      },
    },
  },
};
