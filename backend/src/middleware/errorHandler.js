// src/middleware/errorHandler.js

/**
 * Central error handler — attach to app AFTER all routes.
 * Catches everything passed via next(err).
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";

  // Mongoose validation error (e.g. missing required field)
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(". ");
  }

  // Mongoose duplicate key (e.g. email already exists)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // Mongoose cast error (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Don't leak stack traces in production
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  if (process.env.NODE_ENV === "development") {
    console.error(`❌ [${req.method}] ${req.path} →`, err.message);
  }

  res.status(statusCode).json(response);
};

/**
 * 404 handler — for routes that don't exist
 */
const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

module.exports = { errorHandler, notFound };