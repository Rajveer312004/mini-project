const express = require("express");
const router = express.Router();
const {
  getPublicSchemes,
  getPublicTransactions,
  submitGrievance,
  getGrievances,
  generatePublicReport
} = require("../controllers/publicController");
const { upload } = require("../utils/upload");

// Get all active schemes (public access)
router.get("/schemes", getPublicSchemes);

// Get transaction history (public access)
router.get("/transactions", getPublicTransactions);

// Submit grievance (public access)
router.post("/grievance", upload.array('documents', 5), submitGrievance);

// Get grievances (public access - can filter by submittedBy)
router.get("/grievances", getGrievances);

// Generate downloadable reports (public access)
router.get("/report", generatePublicReport);

module.exports = router;

