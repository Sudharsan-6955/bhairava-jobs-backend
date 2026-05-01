const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  getMe,
  updatePassword,
  verifyToken
} = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  validateLogin,
  validateAdminRegistration
} = require('../middleware/validationMiddleware');
const sanitizeMiddleware = require('../middleware/sanitizeMiddleware');

/**
 * Authentication Routes with Proper XSS Protection
 * 
 * Auth routes don't use multer (JSON only), so sanitization can run early.
 * Order: sanitize → validate → controller
 */

// Public routes (no protection)
router.post('/login', sanitizeMiddleware, validateLogin, loginAdmin);
router.post('/refresh', sanitizeMiddleware, refreshAccessToken);
router.post('/register', optionalAuth, sanitizeMiddleware, validateAdminRegistration, registerAdmin);

// Protected routes (require authentication - explicitly applied to each route)
router.post('/logout', protect, sanitizeMiddleware, logoutAdmin);
router.get('/me', protect, sanitizeMiddleware, getMe);
router.get('/verify', protect, sanitizeMiddleware, verifyToken);
router.put('/password', protect, sanitizeMiddleware, updatePassword);

module.exports = router;
