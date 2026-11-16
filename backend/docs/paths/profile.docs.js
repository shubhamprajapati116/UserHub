// backend/docs/paths/profile.docs.js

module.exports = {
  "/profile": {
    get: {
      tags: ["Profile"],
      summary: "Get logged-in user profile",
      description:
        "Returns the authenticated user's full profile details (excluding password and reset tokens). Requires JWT Bearer token.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "User profile retrieved successfully",
          content: {
            "application/json": {
              example: {
                _id: "665f1b2c3d4e5f6a7b8c9d0e",
                name: "Rahul Sharma",
                email: "user@example.com",
                dob: "1998-05-15T00:00:00.000Z",
                gender: "male",
                role: "user",
                status: "active",
                isVerified: true,
                phone: "9876543210",
                bio: "Full-stack developer",
                country: "India",
                state: "Gujarat",
                city: "Ahmedabad",
                profilephoto: "avatar-123456.jpg",
                experience: [],
              },
            },
          },
        },
        401: {
          description: "Missing, invalid, expired token or revoked session",
          content: {
            "application/json": {
              example: {
                message: "Access Denied: No token provided.",
              },
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              example: {
                message: "User not found",
              },
            },
          },
        },
        429: {
          description: "Too many API requests (userApiLimiter)",
          content: {
            "application/json": {
              example: {
                success: false,
                message:
                  "Too many requests from your account. Please slow down.",
              },
            },
          },
        },
        500: {
          description: "Internal server error",
        },
      },
    },
  },
};
