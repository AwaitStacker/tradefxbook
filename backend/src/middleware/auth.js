// src/middleware/auth.js
const jwt  = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — validates JWT on every protected route.
 * Attaches req.user = { id, email, plan } from token payload.
 * Frontend must send: Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token signature + expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please login again.",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    // 3. Check user still exists and is active
    const user = await User.findById(decoded.id).select("-password -refreshToken");
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists or has been deactivated.",
      });
    }

    // 4. Attach to request — all downstream handlers have access to req.user
    req.user = user;
    next();

  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(500).json({ success: false, message: "Server error during authentication." });
  }
};

/**
 * requireOwnership — ensures userId param/body matches the logged-in user.
 * Use after protect().
 * Prevents User A from accessing User B's data by guessing IDs.
 */
const requireOwnership = (resourceUserIdField = "userId") => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have access to this resource.",
      });
    }
    next();
  };
};

module.exports = { protect, requireOwnership };