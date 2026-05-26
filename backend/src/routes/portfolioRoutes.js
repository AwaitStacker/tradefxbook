// src/routes/portfolioRoutes.js
const express  = require("express");
const router   = express.Router();
const ctrl     = require("../controllers/portfolioController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get  ("/", ctrl.getPortfolio);
router.patch("/", ctrl.updatePortfolio);

module.exports = router;