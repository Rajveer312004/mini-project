const mongoose = require("mongoose");

const proofOfWorkSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      ref: 'FundUtilizationRequest'
    },
    proofType: {
      type: String,
      enum: ['photograph', 'bill', 'receipt', 'certificate', 'other'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    file: {
      fileName: String,
      filePath: String,
      fileType: String,
      fileSize: Number,
    },
    uploadedBy: {
      type: String,
      required: true,
    },
    workCompletionDate: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProofOfWork", proofOfWorkSchema);

