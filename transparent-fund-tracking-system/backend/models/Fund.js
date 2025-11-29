const mongoose = require("mongoose");

const FundSchema = new mongoose.Schema(
  {
    schemeId: {
      type: Number,
      required: false,
      unique: false,
    },
    name: {
      type: String,
      required: true,
    },
    totalFunds: {
      type: Number,
      required: true,
      default: 0,
    },
    usedFunds: {
      type: Number,
      required: true,
      default: 0,
    },
    eligibilityCriteria: {
      type: String,
      required: false,
      default: "",
    },
  },
  { timestamps: true } // ✅ Adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("Fund", FundSchema);
