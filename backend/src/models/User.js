// src/models/User.js
const mongoose  = require("mongoose");
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const validator = require("validator");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, "Name is required"],
      trim:      true,
      minlength: [2,  "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
      validate:  [validator.isEmail, "Invalid email address"],
    },
    password: {
      type:      String,
      // Not required at schema level — Google-auth users have no password
      minlength: [8, "Password must be at least 8 characters"],
      select:    false,
    },
    // ── Auth provider ─────────────────────────────────────────────────────────
    // "local" = email+password, "google" = Google OAuth
    authProvider: {
      type:    String,
      enum:    ["local", "google"],
      default: "local",
    },
    googleId: { type: String, select: false },

    // ── Email verification (OTP) ──────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailOTP:        { type: String,  select: false },
    emailOTPExpires: { type: Date,    select: false },

    // ── Password reset ────────────────────────────────────────────────────────
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },

    // ── Profile ───────────────────────────────────────────────────────────────
    accountCurrency: { type: String, default: "USD" },
    timezone:        { type: String, default: "Asia/Kolkata" },
    avatarUrl:       { type: String },

    // ── Auth tracking ─────────────────────────────────────────────────────────
    lastLoginAt:  { type: Date },
    refreshToken: { type: String, select: false },

    // ── Future: subscription ──────────────────────────────────────────────────
    plan:     { type: String, enum: ["free", "pro"], default: "free" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
UserSchema.index({ email:    1 });
UserSchema.index({ googleId: 1 }, { sparse: true });

// ── Pre-save: hash password ───────────────────────────────────────────────────
// FIX: Mongoose 8 async middleware does NOT receive `next` as a parameter.
// Use the Promise-based pattern (no next argument) — return a Promise implicitly
// by using async/await without calling next().
// If you DO need to call next(), keep the parameter and call it explicitly.
// The safest cross-version pattern is below — works on Mongoose 6, 7, and 8.
UserSchema.pre("save", async function () {
  // Only hash when password field was actually changed
  if (!this.isModified("password") || !this.password) return;
  const salt  = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance methods ──────────────────────────────────────────────────────────

UserSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.password) return false; // Google users have no password
  return bcrypt.compare(plainPassword, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, plan: this.plan },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
  );
};

// Returns a safe plain object — never exposes password/tokens/OTP
UserSchema.methods.toSafeObject = function () {
  return {
    id:              this._id,
    name:            this.name,
    email:           this.email,
    plan:            this.plan,
    authProvider:    this.authProvider,
    isEmailVerified: this.isEmailVerified,
    accountCurrency: this.accountCurrency,
    timezone:        this.timezone,
    avatarUrl:       this.avatarUrl || null,
    createdAt:       this.createdAt,
    lastLoginAt:     this.lastLoginAt,
  };
};

module.exports = mongoose.model("User", UserSchema);