// src/models/Portfolio.js
const mongoose = require("mongoose");

const PortfolioSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true, // One portfolio per user
    },
    initialCapital:  { type: Number, default: 0 },
    currentBalance:  { type: Number, default: 0 },
    currency:        { type: String, default: "USD" },
    riskPerTrade:    { type: Number, default: 1 },     // % risk per trade
    maxDailyLoss:    { type: Number, default: 5 },     // % max daily loss
    maxDrawdown:     { type: Number, default: 10 },    // % max drawdown
    propFirmTarget:  { type: Number, default: 10 },    // % profit target
    notes:           { type: String, maxlength: 1000 },
    // Future: broker connection
    brokerConnected: { type: Boolean, default: false },
    brokerName:      { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Portfolio", PortfolioSchema);