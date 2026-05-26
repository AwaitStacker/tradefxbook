// src/utils/otpUtils.js
// Responsibility: generate and verify 6-digit OTPs.
// OTPs are stored as bcrypt hashes in the DB — not plain text.

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const otpUtils = {
  // Generate a 6-digit numeric OTP
  generate: () => String(Math.floor(100000 + Math.random() * 900000)),

  // Hash the OTP before storing in DB
  hash: async (otp) => bcrypt.hash(otp, 10),

  // Compare plain OTP against stored hash
  verify: async (plain, hashed) => bcrypt.compare(plain, hashed),

  // Returns Date object for expiry
  expiresAt: () => new Date(Date.now() + OTP_EXPIRY_MS),

  // Generate a secure random token for password reset URLs
  generateResetToken: () => crypto.randomBytes(32).toString("hex"),

  // Hash reset token before storing (SHA-256, not bcrypt — it's not a password)
  hashResetToken: (token) => crypto.createHash("sha256").update(token).digest("hex"),
};

module.exports = otpUtils;