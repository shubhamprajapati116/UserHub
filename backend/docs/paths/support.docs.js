// backend/docs/paths/support.docs.js

module.exports = {
  "/support/status": {
    get: {
      tags: ["Support"],
      summary: "Check system & database health status",
      description:
        "Public endpoint to check operational status of the API server, MongoDB database, Auth 2FA engine, and Email service.",
      responses: {
        200: {
          description: "System health status retrieved successfully",
          content: {
            "application/json": {
              example: {
                status: "operational",
                systems: {
                  api: { status: "operational", latency: "14ms" },
                  database: {
                    status: "operational",
                    uptime: "99.98%",
                    connectionState: "connected",
                  },
                  auth2FA: {
                    status: "operational",
                    provider: "UserHub Identity Engine",
                  },
                  emailService: {
                    status: "operational",
                    protocol: "SMTP / TLS",
                  },
                },
                lastIncident: "None in the last 90 days",
                serverTime: "2026-11-16T11:30:00.000Z",
                updatedAt: "2026-11-16T11:30:00.000Z",
              },
            },
          },
        },
      },
    },
  },
};
