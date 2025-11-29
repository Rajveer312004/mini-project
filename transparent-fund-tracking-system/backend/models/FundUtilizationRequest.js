const mongoose = require("mongoose");

const fundUtilizationRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      default: () => `UR-${Date.now()}-${Math.random().toString(36).substring(7)}`
    },
    schemeId: {
      type: Number,
      required: true,
    },
    requestingAgency: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    supportingDocuments: [{
      fileName: String,
      filePath: String,
      fileType: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'in-progress', 'completed'],
      default: 'pending'
    },
    executor: {
      type: String,
      required: true,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    totalExpenditure: {
      type: Number,
      default: 0,
    },
    txHash: {
      type: String,
      default: null,
    },
    completionDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FundUtilizationRequest", fundUtilizationRequestSchema);

