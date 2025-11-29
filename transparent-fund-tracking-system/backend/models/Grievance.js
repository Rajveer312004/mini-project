const mongoose = require("mongoose");

const grievanceSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: String,
      required: true,
      unique: true,
      default: () => `GR-${Date.now()}-${Math.random().toString(36).substring(7)}`
    },
    schemeId: {
      type: Number,
      required: false,
    },
    schemeName: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ['fund-misuse', 'irregularity', 'delay', 'corruption', 'other'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: "",
    },
    beneficiaryName: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      default: "",
    },
    contactPhone: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ['pending', 'under-review', 'resolved', 'rejected'],
      default: 'pending'
    },
    submittedBy: {
      type: String,
      required: true,
    },
    reviewedBy: {
      type: String,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    supportingDocuments: [{
      fileName: String,
      filePath: String,
      fileType: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Grievance", grievanceSchema);

