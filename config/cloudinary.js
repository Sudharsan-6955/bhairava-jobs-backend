const cloudinary = require('cloudinary').v2;

/**
 * Configure Cloudinary for secure image storage
 * SDK configuration for manual uploads from memory buffer
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Force HTTPS URLs
});

/**
 * Upload image to Cloudinary from memory buffer
 * @param {Buffer} fileBuffer - File buffer from multer memory storage
 * @param {string} filename - Original filename
 * @returns {Promise<object>} Upload result with secure_url and public_id
 */
const uploadToCloudinary = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    // Generate unique public_id
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const publicId = `job-${uniqueSuffix}`;

    // Upload options
    const uploadOptions = {
      folder: 'job-posters',
      public_id: publicId,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        {
          width: 1200,
          height: 630,
          crop: 'limit', // Maintain aspect ratio
          quality: 'auto:good',
          fetch_format: 'auto'
        }
      ],
      overwrite: false,
      invalidate: true // Invalidate CDN cache
    };

    // Upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format
          });
        }
      }
    );

    // Pipe buffer to upload stream
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<object>} Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = { 
  cloudinary, 
  uploadToCloudinary,
  deleteFromCloudinary
};
