const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  schemeId: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  purpose: {
    type: String,
    default: "Fund usage",
  },
  executor: {
    type: String, // Ethereum wallet address
    required: true,
  },
  txHash: {
    type: String, // Blockchain transaction hash
    required: true,
    unique: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
