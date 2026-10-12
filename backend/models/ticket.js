const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Account & Security",
        "Profile & Customization",
        "Active Sessions & Devices",
        "Bug Report",
        "Feature Request",
        "Other Inquiry",
        "General Inquiry",
      ],
      default: "General Inquiry",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    estimatedResponseTime: {
      type: String,
      default: "Under 2 hours",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);
