const multer = require('multer');
const path = require('path');
const { uploadToCloudinary } = require('../config/cloudinary');
const { asyncHandler } = require('./errorMiddleware');

/**
 * Secure File Upload Middleware using Multer Memory Storage
 * Images are stored in memory buffer then uploaded to Cloudinary
 * 
 * Security Features:
 * - File type validation (only images)
 * - File size limits (2MB max)
 * - MIME type checking
 * - Extension validation
 * - Direct Cloudinary upload (no local storage)
 */

/**
 * Multer memory storage configuration
 * Files are stored in memory as Buffer before Cloudinary upload
 */
const storage = multer.memoryStorage();

/**
 * File filter to accept only specific image types
 * Prevents malicious file uploads
 */
const fileFilter = (req, file, cb) => {
  // Allowed image MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  // Allowed file extensions
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExt = path.extname(file.originalname).toLowerCase();

  // Validate MIME type and extension
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

/**
 * Multer configuration with memory storage
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size
    files: 1 // Only one file at a time
  }
});

/**
 * Single file upload middleware
 * Field name: 'posterImage'
 */
const uploadSingle = upload.single('posterImage');

/**
 * Error handling wrapper for upload middleware
 * Provides user-friendly error messages
 */
const handleUploadError = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 2MB.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file is allowed.'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected field. Use "posterImage" as field name.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      // Custom validation errors
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    next();
  });
};

/**
 * Upload file to Cloudinary middleware
 * Processes buffer from memory storage and uploads to Cloudinary
 */
const uploadToCloudinaryMiddleware = asyncHandler(async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a job poster image.'
      });
    }

    // Validate file buffer exists
    if (!req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file data. Please try again.'
      });
    }

    if (process.env.NODE_ENV === 'development') {
      const logger = require('../utils/logger');
      logger.debug({ file: req.file.originalname }, 'Uploading image to Cloudinary');
    }

    // Upload to Cloudinary from memory buffer
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname
    );

    if (process.env.NODE_ENV === 'development') {
      const logger = require('../utils/logger');
      logger.debug({ url: uploadResult.secure_url }, 'Image uploaded to Cloudinary');
    }

    // Attach Cloudinary URL to request body
    req.body.posterImage = uploadResult.secure_url;
    req.body.cloudinaryId = uploadResult.public_id;

    // Store upload info for reference
    req.cloudinaryUpload = uploadResult;

    next();
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error({ err: error }, 'Cloudinary upload error');

    const isAuthError = String(error?.message || '').toLowerCase().includes('api key')
      || String(error?.message || '').toLowerCase().includes('signature')
      || String(error?.message || '').toLowerCase().includes('authorization');

    return res.status(500).json({
      success: false,
      message: isAuthError
        ? 'Cloudinary authentication failed. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
        : 'Failed to upload image to cloud storage. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Optional file upload middleware
 * Allows requests without files to pass through
 */
const optionalUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      // If there's an error, attach it to request for later handling
      req.uploadError = err;
    }
    
    next();
  });
};

/**
 * Optional Cloudinary upload
 * Only uploads if file exists
 */
const optionalCloudinaryUpload = asyncHandler(async (req, res, next) => {
  try {
    // If file was uploaded, upload to Cloudinary
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname
      );
      
      req.body.posterImage = uploadResult.secure_url;
      req.body.cloudinaryId = uploadResult.public_id;
      req.cloudinaryUpload = uploadResult;
    }
    
    next();
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error({ err: error }, 'Cloudinary upload error (optional)');
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

module.exports = {
  uploadSingle,
  handleUploadError,
  uploadToCloudinaryMiddleware,
  optionalUpload,
  optionalCloudinaryUpload
};
