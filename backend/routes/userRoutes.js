const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const verifyToken = require("../middleware/verifytoken");
const verifyAdmin = require("../middleware/VerifyAdmin");
const {
  getUsers,
  deleteuser,
  updateuser,
  makeAdmin,
  getUserById,
  addUser,
   verifyEmail,
} = require("../controllers/usercontroller");
const {
  registeruser,
  loginuser,
  forgotpassword,
  resetPassword,
} = require("../controllers/authcontroller");
const {
  getProfile,
  updateProfile,
  deleteProfile,
  changepassword,
} = require("../controllers/profileController");


const User = require("../models/user");
const userSchema = require("../validations/validate");

router.get("/profile", verifyToken, getProfile);
router.post("/register", upload.single("profilephoto"), registeruser);
router.get("/Users", verifyToken, verifyAdmin, getUsers);
router.get("/Users/:id", verifyToken, verifyAdmin, getUserById);
router.delete("/Users/:id", verifyToken, verifyAdmin, deleteuser);

router.put(
  "/Users/:id",
  verifyToken,
  verifyAdmin,
  upload.single("profilephoto"),
  updateuser,
);
router.put(
  "/profile",
  verifyToken,
  upload.single("profilephoto"),
  updateProfile,
);

router.delete("/account-delete", verifyToken, deleteProfile);
router.post(
  "/admin/users",
  verifyToken,
  verifyAdmin,
  upload.single("profilephoto"),
  addUser,
);
router.post("/login", loginuser);
router.post("/forgot-password", forgotpassword);
router.post("/reset-password/:token", resetPassword);
router.put("/Users/:id/make-admin", verifyToken, verifyAdmin, makeAdmin);
router.get("/verify-email/:token", verifyEmail);
router.put("/change-password", verifyToken, changepassword);
module.exports = router;
