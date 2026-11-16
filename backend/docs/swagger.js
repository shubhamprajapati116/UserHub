// backend/docs/swagger.js

const schemas = require("./component");
const paths = require("./paths");

const swaggerSpec = {
  openapi: "3.0.0",

  info:{
    title: "UserHub API Documentation",
    version: "1.0.0",
    description:
      "Complete REST API documentation for UserHub (Auth, Profile, Sessions, Notifications, Support & Admin).",
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: "Local Development Server",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "Register, Login, OTP, Email Verification & Password Reset",
    },
    {
      name: "Profile",
      description: "User profile, Photo, Experience & Security settings",
    },
    { name: "Sessions", description: "Active devices & Logout management" },
    { name: "Notifications", description: "User notifications management" },
    { name: "Support", description: "System status & Support tickets" },
    {
      name: "Admin",
      description: "Admin user management, Analytics & Invites",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Login ke baad mila JWT token yahan paste karein",
      },
    },
    schemas,
  },
  paths,
};

module.exports = swaggerSpec;
