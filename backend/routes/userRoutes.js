const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const profileRoutes = require("./profileRoutes");
const sessionRoutes = require("./sessionRoutes");
const supportRoutes = require("./supportRoutes");

router.use(authRoutes);
router.use(adminRoutes);
router.use(profileRoutes);
router.use(sessionRoutes);
router.use(supportRoutes);

module.exports = router;
