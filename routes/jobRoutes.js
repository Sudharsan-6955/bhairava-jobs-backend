const express = require('express');
const router = express.Router();
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  permanentlyDeleteJob,
  getJobStats,
  incrementShareCount,
  getJobsByCategory,
  searchJobs
} = require('../controllers/jobController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { adminOnly, superAdminOnly } = require('../middleware/adminMiddleware');
const {
  handleUploadError,
  uploadToCloudinaryMiddleware,
  optionalUpload,
  optionalCloudinaryUpload
} = require('../middleware/uploadMiddleware');
const {
  validateJobCreation,
  validateJobUpdate,
  validateObjectId
} = require('../middleware/validationMiddleware');
const sanitizeMiddleware = require('../middleware/sanitizeMiddleware');

/**
 * Job Routes with Proper XSS Protection
 * 
 * CRITICAL: Sanitization is applied AFTER multer processes file uploads.
 * This ensures req.body (populated by multer) is fully sanitized before controllers.
 */

// Public routes (MUST come before :id routes)
router.get('/', optionalAuth, sanitizeMiddleware, getAllJobs);
router.get('/search', sanitizeMiddleware, searchJobs);
router.get('/category/:category', sanitizeMiddleware, getJobsByCategory);

// Protected admin routes (apply explicitly to specific routes)
// GET /stats/overview - Get job statistics (protected + admin only) - MUST come BEFORE /:id route
router.get('/stats/overview', protect, adminOnly, sanitizeMiddleware, getJobStats);

// POST / - Create job (protected + admin only)
// ⚠️ CRITICAL ORDER: multer → sanitize → validate → controller
router.post(
  '/',
  protect,
  adminOnly,
  handleUploadError,              // 1. Multer processes multipart/form-data
  uploadToCloudinaryMiddleware,   // 2. Upload to Cloudinary
  sanitizeMiddleware,             // 3. ✅ Sanitize req.body (now populated)
  validateJobCreation,            // 4. Validate sanitized data
  createJob                       // 5. Safe to store in DB
);

// Wildcard routes (MUST come AFTER specific routes)
router.get('/:id', validateObjectId('id'), optionalAuth, sanitizeMiddleware, getJobById);
router.post('/:id/share', validateObjectId('id'), sanitizeMiddleware, incrementShareCount);

// PUT /:id - Update job (protected + admin only)
// ⚠️ CRITICAL ORDER: multer → sanitize → validate → controller
router.put(
  '/:id',
  protect,
  adminOnly,
  validateObjectId('id'),
  optionalUpload,                 // 1. Multer processes multipart (if file exists)
  optionalCloudinaryUpload,       // 2. Upload to Cloudinary (if file exists)
  sanitizeMiddleware,             // 3. ✅ Sanitize req.body (now populated)
  validateJobUpdate,              // 4. Validate sanitized data
  updateJob                       // 5. Safe to store in DB
);

// DELETE /:id - Soft delete job (protected + admin only)
router.delete(
  '/:id',
  protect,
  adminOnly,
  validateObjectId('id'),
  sanitizeMiddleware,
  deleteJob
);

// DELETE /:id/permanent - Permanent delete (protected + superadmin only)
router.delete(
  '/:id/permanent',
  protect,
  superAdminOnly,
  validateObjectId('id'),
  sanitizeMiddleware,
  permanentlyDeleteJob
);

module.exports = router;
