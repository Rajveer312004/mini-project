const mongoose = require("mongoose");

const utilizationCertificateSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      ref: 'FundUtilizationRequest'
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => `UC-${Date.now()}-${Math.random().toString(36).substring(7)}`
    },
    schemeId: {
      type: Number,
      required: true,
    },
    schemeName: {
      type: String,
      required: true,
    },
    requestingAgency: {
      type: String,
      required: true,
    },
    approvedAmount: {
      type: Number,
      required: true,
    },
    totalExpenditure: {
      type: Number,
      required: true,
    },
    remainingBalance: {
      type: Number,
      required: true,
    },
    period: {
      startDate: Date,
      endDate: Date,
    },
    generatedBy: {
      type: String,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    certificateDocument: {
      fileName: String,
      filePath: String,
      fileType: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UtilizationCertificate", utilizationCertificateSchema);

