// src/server.js
require("dotenv").config();

const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const morgan      = require("morgan");
const compression = require("compression");
const rateLimit   = require("express-rate-limit");

const connectDB   = require("./config/db");
const authRoutes  = require("./routes/authRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// ── Connect Database ───────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
// FIX: helmet's default Cross-Origin-Opener-Policy is "same-origin", which
// blocks Google Identity Services popup from posting messages back to the page.
// We set it to "same-origin-allow-popups" so Google's auth popup works correctly.
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  contentSecurityPolicy: false, // Disable CSP in dev; enable explicitly in prod
}));

// ── CORS — allow only your frontend ───────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:3000", // CRA fallback
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman) in dev
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods:     ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Body Parsing ──────────────────────────────────────────────────────────────
// Increase limit for bulk import (localStorage dumps can be large)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  message:  { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders:   false,
});
// Stricter limit on auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      20,
  message:  { success: false, message: "Too many auth attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders:   false,
});

app.use("/api/", limiter);
app.use("/api/auth/login",  authLimiter);
app.use("/api/auth/signup", authLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status:  "ok",
    env:     process.env.NODE_ENV,
    version: "1.0.0",
    time:    new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/trades",    tradeRoutes);
app.use("/api/portfolio", portfolioRoutes);

// Future routes — uncomment when implemented:
// app.use("/api/ai",        aiRoutes);
// app.use("/api/reports",   reportRoutes);

// ── 404 + Error Handlers ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 TradeFXBook API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing HTTP server...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});

module.exports = app;