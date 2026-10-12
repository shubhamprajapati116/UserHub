const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const verifyToken = require("../middleware/verifytoken");
const User = require("../models/user");
const Ticket = require("../models/ticket");
const createNotification = require("../utils/createNotification");

router.get("/support/status", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.json({
    status: isDbConnected ? "operational" : "degraded",
    systems: {
      api: { status: "operational", latency: "14ms" },
      database: {
        status: isDbConnected ? "operational" : "degraded",
        uptime: "99.98%",
        connectionState: isDbConnected ? "connected" : "disconnected",
      },
      auth2FA: { status: "operational", provider: "UserHub Identity Engine" },
      emailService: { status: "operational", protocol: "SMTP / TLS" },
    },
    lastIncident: "None in the last 90 days",
    serverTime: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
});

router.post("/support/ticket", verifyToken, async (req, res) => {
  try {
    const { category, priority = "normal", subject, message } = req.body;

    if (!subject || subject.trim().length < 3) {
      return res.status(400).json({
        message: "Subject must be at least 3 characters long.",
      });
    }

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        message: "Message must be at least 10 characters long.",
      });
    }

    const validCategories = [
      "Account & Security",
      "Profile & Customization",
      "Active Sessions & Devices",
      "Bug Report",
      "Feature Request",
      "Other Inquiry",
    ];

    const finalCategory = validCategories.includes(category)
      ? category
      : "General Inquiry";

    const validPriorities = ["low", "normal", "high", "urgent"];
    const finalPriority = validPriorities.includes(priority?.toLowerCase())
      ? priority.toLowerCase()
      : "normal";

    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select("name email role");

    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const ticketId = `TICK-${randomNum}`;

    const estimatedResponseTime =
      finalPriority === "urgent"
        ? "Under 30 minutes"
        : finalPriority === "high"
          ? "Under 1 hour"
          : "Under 2 hours";

    const newTicket = new Ticket({
      userId: user._id,
      ticketId,
      category: finalCategory,
      priority: finalPriority,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
      estimatedResponseTime,
    });

    await newTicket.save();

    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      for (const admin of admins) {
        if (admin._id.toString() !== user._id.toString()) {
          await createNotification({
            userId: admin._id,
            type: "security_alert",
            title: `Support Ticket [${ticketId}]`,
            message: `${user.name || user.email} submitted a ${finalPriority.toUpperCase()} priority ticket: "${subject.trim()}"`,
            metadata: {
              ticketId,
              category: finalCategory,
              priority: finalPriority,
              fromUser: user.email,
            },
          });
        }
      }
    } catch (notifyErr) {
      console.error("Failed to notify admins of support ticket:", notifyErr.message);
    }

    try {
      await createNotification({
        userId: user._id,
        type: "welcome",
        title: `Ticket Created [${ticketId}]`,
        message: `Your ticket "${subject.trim()}" has been received. Our support team will review it shortly.`,
        metadata: {
          ticketId,
          category: finalCategory,
          priority: finalPriority,
        },
      });
    } catch (userNotifyErr) {
      console.error("Failed to notify user of ticket creation:", userNotifyErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Support ticket #${ticketId} created successfully.`,
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return res.status(500).json({
      message: "Failed to submit support ticket. Please try again later.",
    });
  }
});

router.get("/support/my-tickets", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const tickets = await Ticket.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return res.status(500).json({
      message: "Failed to fetch your support tickets.",
    });
  }
});

module.exports = router;
