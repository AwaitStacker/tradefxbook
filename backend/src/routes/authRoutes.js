// src/routes/authRoutes.js
const express     = require("express");
const router      = express.Router();
const ctrl        = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// ── Public routes ──────────────────────────────────────────────────────────
router.post("/signup",           ctrl.signup);
router.post("/verify-otp",       ctrl.verifyOTP);
router.post("/resend-otp",       ctrl.resendOTP);
router.post("/login",            ctrl.login);
router.post("/google",           ctrl.googleAuth);
router.post("/forgot-password",  ctrl.forgotPassword);
router.post("/reset-password",   ctrl.resetPassword);
router.post("/refresh",          ctrl.refresh);

// ── Protected routes (require valid JWT) ───────────────────────────────────
router.post  ("/logout",          protect, ctrl.logout);
router.get   ("/me",              protect, ctrl.getMe);
router.patch ("/me",              protect, ctrl.updateMe);
router.patch ("/change-password", protect, ctrl.changePassword);

module.exports = router;