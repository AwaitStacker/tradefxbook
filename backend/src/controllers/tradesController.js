// src/controllers/tradesController.js
const Trade = require("../models/Trade");

// ── GET /api/trades  — get ALL trades for the logged-in user ─────────────────
exports.getTrades = async (req, res, next) => {
  try {
    const { pair, session, from, to, isWin, limit = 500, skip = 0 } = req.query;

    const filter = { userId: req.user._id };
    if (pair)    filter.pair    = pair.toUpperCase();
    if (session) filter.session = session;
    if (isWin !== undefined) filter.isWin = isWin === "true";
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }

    const trades = await Trade.find(filter)
      .sort({ date: -1 })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 1000)) // Hard cap
      .lean(); // Plain JS objects — faster

    res.json({ success: true, count: trades.length, trades });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/trades  — create one trade ─────────────────────────────────────
exports.createTrade = async (req, res, next) => {
  try {
    const trade = await Trade.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, trade });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/trades/:id  — update a trade ───────────────────────────────────
exports.updateTrade = async (req, res, next) => {
  try {
    // CRITICAL: always filter by BOTH _id AND userId — prevents cross-user tampering
    const trade = await Trade.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!trade) {
      return res.status(404).json({ success: false, message: "Trade not found." });
    }
    res.json({ success: true, trade });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/trades/:id  — delete a trade ──────────────────────────────────
exports.deleteTrade = async (req, res, next) => {
  try {
    const trade = await Trade.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id, // Authorization: can only delete own trades
    });

    if (!trade) {
      return res.status(404).json({ success: false, message: "Trade not found." });
    }
    res.json({ success: true, message: "Trade deleted." });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/trades/bulk  — import all localStorage trades on first login ─────
// This is the migration endpoint. Frontend sends its entire trades array once.
exports.bulkImport = async (req, res, next) => {
  try {
    const { trades } = req.body;

    if (!Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ success: false, message: "trades array is required." });
    }

    // Limit bulk import to 2000 trades per call
    const batch = trades.slice(0, 2000);

    // Build upsert ops — use clientId to avoid duplicates on re-import
    const ops = batch.map(t => ({
      updateOne: {
        filter: { userId: req.user._id, clientId: t.id || t.clientId },
        update: { $setOnInsert: { ...t, userId: req.user._id, clientId: t.id || t.clientId } },
        upsert: true,
      },
    }));

    const result = await Trade.bulkWrite(ops, { ordered: false });

    res.status(200).json({
      success:  true,
      inserted: result.upsertedCount,
      matched:  result.matchedCount,
      message:  `Migration complete. ${result.upsertedCount} new trades imported.`,
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/trades/all  — delete ALL trades for a user (use with care) ────
exports.deleteAllTrades = async (req, res, next) => {
  try {
    const result = await Trade.deleteMany({ userId: req.user._id });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    next(err);
  }
};