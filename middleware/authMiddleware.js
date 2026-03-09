const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { asyncHandler } = require('./errorMiddleware');

/**
 * Authentication Middleware
 * Verifies JWT access token from HTTP-only cookie
 * Protects routes from unauthorized access
 */
const protect = asyncHandler(async (req, res, next) => {
  try {
    let token;

    // Get token from HTTP-only cookie (most secure)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback: Get token from Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify access token
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
        issuer: 'job-platform-api',
        audience: 'job-platform-admin'
      });

      // Get admin from token (exclude password and refresh token)
      const admin = await Admin.findById(decoded.id).select('-password -refreshToken');

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found. Token is invalid.'
        });
      }

      // Check if admin account is active
      if (!admin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.'
        });
      }

      // Check if account is locked
      if (admin.isLocked) {
        const lockTime = Math.ceil((admin.lockUntil - Date.now()) / 60000);
        return res.status(423).json({
          success: false,
          message: `Account is temporarily locked. Try again in ${lockTime} minutes.`
        });
      }

      // Attach admin to request object
      req.admin = admin;
      next();

    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token has expired. Please refresh your token.',
          expired: true
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.'
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
});

/**
 * Optional Authentication Middleware
 * Allows access even without token, but attaches admin if token exists
 * Useful for routes that have different behavior for authenticated users
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
          issuer: 'job-platform-api',
          audience: 'job-platform-admin'
        });
        const admin = await Admin.findById(decoded.id).select('-password -refreshToken');
        
        if (admin && admin.isActive && !admin.isLocked) {
          req.admin = admin;
        }
      } catch (error) {
        // Silently fail for optional auth
        req.admin = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
});

module.exports = {
  protect,
  optionalAuth
};
