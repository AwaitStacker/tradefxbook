// src/controllers/portfolioController.js
const Portfolio = require("../models/Portfolio");

// ── GET /api/portfolio ────────────────────────────────────────────────────────
exports.getPortfolio = async (req, res, next) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    // Auto-create if somehow missing
    if (!portfolio) {
      portfolio = await Portfolio.create({ userId: req.user._id });
    }
    res.json({ success: true, portfolio });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/portfolio ───────────────────────────────────────────────────────
exports.updatePortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, runValidators: true, upsert: true }
    );
    res.json({ success: true, portfolio });
  } catch (err) {
    next(err);
  }
};