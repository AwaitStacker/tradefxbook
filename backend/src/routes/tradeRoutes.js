// src/routes/tradeRoutes.js
const express  = require("express");
const router   = express.Router();
const ctrl     = require("../controllers/tradesController");
const { protect } = require("../middleware/auth");

// All trade routes require authentication
router.use(protect);

router.get   ("/",        ctrl.getTrades);
router.post  ("/",        ctrl.createTrade);
router.post  ("/bulk",    ctrl.bulkImport);
router.delete("/all",     ctrl.deleteAllTrades);
router.patch ("/:id",     ctrl.updateTrade);
router.delete("/:id",     ctrl.deleteTrade);

module.exports = router;