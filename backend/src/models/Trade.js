// src/models/Trade.js
// Mirrors the exact trade shape used in TradeFXBook frontend
const mongoose = require("mongoose");

const ChecklistSchema = new mongoose.Schema(
  {
    "Checked higher timeframe": { type: Boolean, default: false },
    "Risk within limits":       { type: Boolean, default: false },
    "Fits my trading plan":     { type: Boolean, default: false },
    "Key levels identified":    { type: Boolean, default: false },
    "Economic calendar checked":{ type: Boolean, default: false },
  },
  { _id: false }
);

const TradeSchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────────────────────────
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true, // Fast per-user queries
    },

    // ── Identity (matches frontend uid()) ────────────────────────────────────
    // We store the frontend-generated id so localStorage migrations are seamless
    clientId: { type: String, index: true },

    // ── Trade core ────────────────────────────────────────────────────────────
    pair:       { type: String, uppercase: true, trim: true },
    direction:  { type: String, enum: ["BUY", "SELL"] },
    date:       { type: Date }, // entry datetime
    exitDate:   { type: Date },

    entry:      { type: Number },
    exit:       { type: Number },
    stopLoss:   { type: Number },
    takeProfit: { type: Number },
    lotSize:    { type: Number },

    // ── Outcomes ─────────────────────────────────────────────────────────────
    pl:     { type: Number, default: 0 },
    pips:   { type: Number },
    rr:     { type: Number }, // risk-to-reward ratio
    isWin:  { type: Boolean, default: false },

    // ── Session & context ─────────────────────────────────────────────────────
    session:    { type: String, enum: ["Asian", "London", "NYC", "Others"] },
    setupType:  { type: String },
    market:     { type: String },
    notes:      { type: String, maxlength: 2000 },

    // ── Execution analysis ────────────────────────────────────────────────────
    preAnalysis:  { type: String, maxlength: 3000 },
    postReview:   { type: String, maxlength: 3000 },
    lessons:      { type: String, maxlength: 2000 },
    followedPlan: { type: Boolean },
    mistakeTags:  [{ type: String }],
    rating:       { type: Number, min: 0, max: 10, default: 5 },

    // ── Psychology ────────────────────────────────────────────────────────────
    emotionBefore: { type: String },
    emotionAfter:  { type: String },

    // ── Journal / checklist ───────────────────────────────────────────────────
    checklist:  { type: ChecklistSchema, default: () => ({}) },
    screenshots: [{ type: String }], // base64 or future: S3 URLs

    // ── Risk ──────────────────────────────────────────────────────────────────
    riskAmount:    { type: Number },
    riskPercent:   { type: Number },
    accountBefore: { type: Number },
    accountAfter:  { type: Number },

    // ── MT5 future ────────────────────────────────────────────────────────────
    mt5TicketId: { type: String },  // For future MT5 sync
    brokerData:  { type: mongoose.Schema.Types.Mixed }, // Raw broker payload
  },
  {
    timestamps: true,
  }
);

// ── Compound indexes for common queries ───────────────────────────────────────
TradeSchema.index({ userId: 1, date: -1 });       // Per-user, date sorted
TradeSchema.index({ userId: 1, pair: 1 });         // Per-user pair filter
TradeSchema.index({ userId: 1, session: 1 });      // Per-user session filter
TradeSchema.index({ userId: 1, isWin: 1 });        // Per-user win/loss filter
TradeSchema.index({ userId: 1, clientId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Trade", TradeSchema);