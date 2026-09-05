require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const app = express();
const { globalLimiter } = require("./middleware/rateLimiter");

// ── Security Headers via Helmet ──
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows static images in /uploads to load on frontend
  }),
);
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(globalLimiter); // Global Rate Limiter for all routes
app.use("/uploads", express.static("uploads"));
app.get("/", (req, res) => {
  res.send("Backend Running");
});
app.use(userRoutes);
app.use(notificationRoutes);
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server Running on Port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database Connection Failed:", error.message);
    process.exit(1);
  }
};

startServer();
