const express = require("express");
const router = express.Router();
const {
  signup,
  signin,
  getProfile,
  updateProfile
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

// Public routes
router.post("/signup", signup);
router.post("/signin", signin);

// Protected routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

module.exports = router;

