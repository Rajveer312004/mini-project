const mongoose = require("mongoose");

const expenditureRecordSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      ref: 'FundUtilizationRequest'
    },
    activity: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
    },
    expenditureDate: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
      enum: ['labor', 'materials', 'equipment', 'transport', 'other'],
      default: 'other'
    },
    vendor: {
      type: String,
      default: "",
    },
    billNumber: {
      type: String,
      default: "",
    },
    billDocument: {
      fileName: String,
      filePath: String,
      fileType: String,
    },
    recordedBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExpenditureRecord", expenditureRecordSchema);

