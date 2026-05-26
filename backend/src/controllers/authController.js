// src/controllers/authController.js
const User         = require("../models/User");
const Portfolio    = require("../models/Portfolio");
const jwt          = require("jsonwebtoken");
const emailService = require("../services/emailService");
const otpUtils     = require("../utils/otpUtils");

// ── Send token response ───────────────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  user.lastLoginAt  = new Date();
  user.save({ validateBeforeSave: false });
  res.status(statusCode).json({
    success: true, accessToken, refreshToken, user: user.toSafeObject(),
  });
};

// ── Helper: safe email send — NEVER crashes server ────────────────────────────
const safeSendEmail = async (fn, label, devFallback) => {
  // ALWAYS print in non-production so devs can test without email setup
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📧 DEV [${label}]: ${devFallback}\n`);
  }
  try {
    await fn();
  } catch (err) {
    console.error(`[email:${label}] send failed:`, err.message);
  }
};

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      if (!existing.isEmailVerified) {
        const otp = otpUtils.generate();
        existing.emailOTP        = await otpUtils.hash(otp);
        existing.emailOTPExpires = otpUtils.expiresAt();
        await existing.save({ validateBeforeSave: false });
        await safeSendEmail(
          () => emailService.sendOTP(existing.email, existing.name, otp),
          "signup-existing", `OTP for ${existing.email} = ${otp}`
        );
        return res.status(200).json({
          success: true, requiresOTP: true, email: existing.email,
          message: "Account exists but not verified. A new code has been sent.",
        });
      }
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const otp = otpUtils.generate();
    const user = await User.create({
      name, email, password,
      authProvider: "local", isEmailVerified: false,
      emailOTP: await otpUtils.hash(otp), emailOTPExpires: otpUtils.expiresAt(),
    });
    await Portfolio.create({ userId: user._id });

    await safeSendEmail(
      () => emailService.sendOTP(user.email, user.name, otp),
      "signup-new", `OTP for ${user.email} = ${otp}`
    );

    res.status(201).json({
      success: true, requiresOTP: true, email: user.email,
      message: "Account created. Please check your email for the verification code.",
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select("+emailOTP +emailOTPExpires");

    // Debug log — shows exactly what state the user document is in
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n🔍 verifyOTP debug for ${email}:`);
      console.log(`   user found:        ${!!user}`);
      console.log(`   isEmailVerified:   ${user?.isEmailVerified}`);
      console.log(`   hasEmailOTP:       ${!!user?.emailOTP}`);
      console.log(`   hasOTPExpires:     ${!!user?.emailOTPExpires}`);
      console.log(`   otpExpired:        ${user?.emailOTPExpires ? user.emailOTPExpires < new Date() : "N/A"}`);
      console.log(`   submittedOTP:      ${otp}\n`);
    }

    if (!user)                return res.status(404).json({ success: false, message: "Account not found." });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: "Email already verified. Please log in." });
    if (!user.emailOTP || !user.emailOTPExpires) return res.status(400).json({ success: false, message: "No verification code found. Please sign up again." });
    if (user.emailOTPExpires < new Date()) return res.status(400).json({ success: false, message: "Verification code expired. Please request a new one." });

    const isValid = await otpUtils.verify(otp.trim(), user.emailOTP);
    if (!isValid) return res.status(400).json({ success: false, message: "Invalid verification code." });

    user.isEmailVerified = true;
    user.emailOTP        = undefined;
    user.emailOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    // Must select +emailOTP so we can update it
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select("+emailOTP +emailOTPExpires");
    if (!user)                return res.status(404).json({ success: false, message: "Account not found." });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: "Email already verified." });

    const otp = otpUtils.generate();
    user.emailOTP        = await otpUtils.hash(otp);
    user.emailOTPExpires = otpUtils.expiresAt();
    await user.save({ validateBeforeSave: false });

    await safeSendEmail(
      () => emailService.sendOTP(user.email, user.name, otp),
      "resend-otp", `OTP for ${user.email} = ${otp}`
    );
    res.json({ success: true, message: "New verification code sent." });
  } catch (err) { next(err); }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated. Contact support." });
    }
    if (!user.isEmailVerified) {
      const otp = otpUtils.generate();
      user.emailOTP        = await otpUtils.hash(otp);
      user.emailOTPExpires = otpUtils.expiresAt();
      await user.save({ validateBeforeSave: false });
      await safeSendEmail(
        () => emailService.sendOTP(user.email, user.name, otp),
        "login-unverified", `OTP for ${user.email} = ${otp}`
      );
      return res.status(403).json({
        success: false, requiresOTP: true, email: user.email,
        message: "Please verify your email. A new code has been sent.",
      });
    }
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// ── POST /api/auth/google ─────────────────────────────────────────────────────
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "Google ID token is required." });
    }
    const { OAuth2Client } = require("google-auth-library");
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let payload;
    try {
      const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ success: false, message: "Invalid Google token." });
    }
    const { sub: googleId, email, name, picture } = payload;
    let user = await User.findOne({ googleId }).select("+googleId");
    if (!user) user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name, email: email.toLowerCase(), authProvider: "google",
        googleId, avatarUrl: picture, isEmailVerified: true,
      });
      await Portfolio.create({ userId: user._id });
    } else if (!user.googleId) {
      user.googleId = googleId; user.authProvider = "google";
      if (picture) user.avatarUrl = picture;
      await user.save({ validateBeforeSave: false });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated." });
    }
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  const SAFE_MSG = "If that email is registered, a reset link has been sent.";
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.authProvider === "google") {
      return res.json({ success: true, message: SAFE_MSG });
    }
    const rawToken    = otpUtils.generateResetToken();
    const hashedToken = otpUtils.hashResetToken(rawToken);
    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await safeSendEmail(
      () => emailService.sendPasswordReset(user.email, user.name, resetUrl),
      "forgot-password", `RESET LINK for ${user.email}: ${resetUrl}`
    );
    res.json({ success: true, message: SAFE_MSG });
  } catch (err) { next(err); }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token and new password are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }
    const hashedToken = otpUtils.hashResetToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");
    if (!user) {
      return res.status(400).json({ success: false, message: "Reset link is invalid or has expired." });
    }
    user.password             = newPassword;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken         = undefined;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token required." });
    }
    let decoded;
    try { decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
    catch { return res.status(401).json({ success: false, message: "Invalid or expired refresh token." }); }
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token revoked." });
    }
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: "Logged out." });
  } catch (err) { next(err); }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = (req, res) => res.json({ success: true, user: req.user.toSafeObject() });

// ── PATCH /api/auth/me ────────────────────────────────────────────────────────
exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ["name", "accountCurrency", "timezone"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ── PATCH /api/auth/change-password ──────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both passwords are required." });
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }
    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};