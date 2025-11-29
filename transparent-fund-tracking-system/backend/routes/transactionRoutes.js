const express = require("express");
const router = express.Router();
const {
  addTransaction,
  getTransactions,
} = require("../controllers/transactionController");

// Add a new transaction
router.post("/", addTransaction);

// Get all transactions
router.get("/", getTransactions);

module.exports = router;
