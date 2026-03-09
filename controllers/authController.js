const Admin = require('../models/Admin');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies
} = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorMiddleware');
const jwt = require('jsonwebtoken');

/**
 * @desc    Register a new admin (Superadmin only)
 * @route   POST /api/auth/register
 * @access  Private/Superadmin
 */
const registerAdmin = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Request body is missing or invalid'
    });
  }

  const adminCount = await Admin.countDocuments();

  if (adminCount > 0) {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to register new admin'
      });
    }

    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can register new admins'
      });
    }
  }

  // Check if admin already exists
  const adminExists = await Admin.findOne({ email: email.toLowerCase() });

  if (adminExists) {
    return res.status(400).json({
      success: false,
      message: 'Admin with this email already exists'
    });
  }

  // Create admin
  const admin = await Admin.create({
    name,
    email: email.toLowerCase(),
    password,
    role: adminCount === 0 ? 'superadmin' : (role || 'admin')
  });

  if (admin) {
    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid admin data');
  }
});

/**
 * @desc    Login admin
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find admin and include password field
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if account is locked
  if (admin.isLocked) {
    const lockTime = Math.ceil((admin.lockUntil - Date.now()) / 60000);
    return res.status(423).json({
      success: false,
      message: `Account is locked due to multiple failed login attempts. Try again in ${lockTime} minutes.`
    });
  }

  // Check if account is active
  if (!admin.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.'
    });
  }

  // Verify password
  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    // Increment login attempts
    await admin.incLoginAttempts();

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Reset login attempts on successful login
  await admin.resetLoginAttempts();

  // Generate tokens
  const accessToken = generateAccessToken(admin._id);
  const refreshToken = generateRefreshToken(admin._id);

  // Save refresh token to database (for refresh token rotation)
  admin.refreshToken = refreshToken;
  await admin.save();

  // Set HTTP-only cookies
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);

  // Send response (without sensitive data)
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      },
      accessToken: accessToken // Also send in response for non-cookie clients
    }
  });
});

/**
 * @desc    Logout admin
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutAdmin = asyncHandler(async (req, res) => {
  // Clear refresh token from database
  if (req.admin) {
    await Admin.findByIdAndUpdate(req.admin._id, {
      $unset: { refreshToken: 1 }
    });
  }

  // Clear cookies
  clearAuthCookies(res);

  // Prevent caching - forces browser to not use back button after logout
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * @desc    Refresh access token with token rotation
 * @route   POST /api/auth/refresh
 * @access  Public (with refresh token)
 * 
 * Implements Refresh Token Rotation for enhanced security:
 * - Generates new access token AND new refresh token
 * - Invalidates old refresh token
 * - Prevents refresh token reuse attacks
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token not found. Please login again.'
    });
  }

  try {
    // Verify refresh token using utility function
    const decoded = verifyRefreshToken(oldRefreshToken);

    // Find admin and verify refresh token matches (prevents token reuse)
    const admin = await Admin.findById(decoded.id).select('+refreshToken');

    if (!admin || admin.refreshToken !== oldRefreshToken) {
      // Possible token reuse attack - clear cookies and reject
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token. Possible security breach detected. Please login again.'
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      clearAuthCookies(res);
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      clearAuthCookies(res);
      return res.status(423).json({
        success: false,
        message: 'Account is locked'
      });
    }

    // Generate NEW access token AND NEW refresh token (rotation)
    const newAccessToken = generateAccessToken(admin._id);
    const newRefreshToken = generateRefreshToken(admin._id);

    // Save new refresh token to database (invalidates old token)
    admin.refreshToken = newRefreshToken;
    await admin.save();

    // Set new tokens in HTTP-only cookies
    setAccessTokenCookie(res, newAccessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      accessToken: newAccessToken
    });

  } catch (error) {
    // Invalid or expired token - clear cookies
    clearAuthCookies(res);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token. Please login again.'
    });
  }
});

/**
 * @desc    Get current admin profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // Admin is already attached to req by auth middleware
  const admin = await Admin.findById(req.admin._id);

  res.status(200).json({
    success: true,
    data: admin
  });
});

/**
 * @desc    Update admin password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current password and new password'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters'
    });
  }

  // Get admin with password
  const admin = await Admin.findById(req.admin._id).select('+password');

  // Verify current password
  const isPasswordValid = await admin.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  admin.password = newPassword;
  await admin.save();

  // Clear all refresh tokens (force re-login on all devices)
  admin.refreshToken = undefined;
  await admin.save();

  // Clear cookies
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully. Please login again.'
  });
});

/**
 * @desc    Verify admin token
 * @route   GET /api/auth/verify
 * @access  Private
 */
const verifyToken = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      admin: req.admin
    }
  });
});

module.exports = {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  getMe,
  updatePassword,
  verifyToken
};
