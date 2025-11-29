const express = require("express");
const router = express.Router();
const {
  submitRequest,
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  recordExpenditure,
  getExpenditures,
  uploadProof,
  getProofs,
  completeRequest,
  generateCertificate,
  getCertificate
} = require("../controllers/utilizationController");
const { upload } = require("../utils/upload");
const { authenticate } = require("../middleware/authMiddleware");

// All utilization routes require authentication
router.use(authenticate);

// Submit fund utilization request with supporting documentation (multiple files)
router.post("/request", upload.array('documents', 10), submitRequest);

// Get all utilization requests (with optional filters) - filtered by user's organization
router.get("/requests", getRequests);

// Get single utilization request with details
router.get("/requests/:id", getRequestById);

// Approve utilization request (triggers blockchain transaction)
router.put("/requests/:id/approve", approveRequest);

// Reject utilization request
router.put("/requests/:id/reject", rejectRequest);

// Record expenditure against request (with optional bill upload)
router.post("/requests/:id/expenditure", upload.single('bill'), recordExpenditure);

// Get expenditures for a request
router.get("/requests/:id/expenditures", getExpenditures);

// Upload proof of work completion (single file)
router.post("/requests/:id/proof", upload.single('file'), uploadProof);

// Get proofs for a request
router.get("/requests/:id/proofs", getProofs);

// Mark request as completed
router.put("/requests/:id/complete", completeRequest);

// Generate utilization certificate
router.post("/requests/:id/certificate", generateCertificate);

// Get certificate for a request
router.get("/requests/:id/certificate", getCertificate);

module.exports = router;

