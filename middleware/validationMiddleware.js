/**
 * Input Validation Middleware with Joi
 * Enhanced validation with better error messages and schema composition
 */

const Joi = require('joi');

/**
 * Joi Schema: Admin Login
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    })
});

/**
 * Validate admin login credentials
 */
const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Joi Schema: Admin Registration
 */
const adminRegistrationSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  role: Joi.string().valid('admin', 'superadmin').optional()
});

/**
 * Validate admin registration/creation
 */
const validateAdminRegistration = (req, res, next) => {
  const { error } = adminRegistrationSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Joi Schema: Job Creation
 */
const jobCreationSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Job title is required',
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Job title is required'
    }),
  company: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Company name is required',
      'string.max': 'Company name cannot exceed 100 characters',
      'any.required': 'Company name is required'
    }),
  location: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Location is required',
      'string.max': 'Location cannot exceed 100 characters',
      'any.required': 'Location is required'
    }),
  description: Joi.string()
    .min(50)
    .max(5000)
    .required()
    .messages({
      'string.empty': 'Job description is required',
      'string.min': 'Description must be at least 50 characters',
      'string.max': 'Description cannot exceed 5000 characters',
      'any.required': 'Job description is required'
    }),
  category: Joi.string()
    .required()
    .messages({
      'string.empty': 'Job category is required',
      'any.required': 'Job category is required'
    }),
  jobType: Joi.string()
    .valid('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Remote')
    .required()
    .messages({
      'any.only': 'Invalid job type. Must be one of: Full-time, Part-time, Contract, Internship, Freelance, Remote',
      'any.required': 'Job type is required'
    }),
  experience: Joi.string()
    .required()
    .messages({
      'string.empty': 'Experience level is required',
      'any.required': 'Experience level is required'
    }),
  posterImage: Joi.string()
    .uri()
    .required()
    .messages({
      'string.empty': 'Job poster image URL is required',
      'string.uri': 'Poster image must be a valid URL',
      'any.required': 'Job poster image is required'
    }),
  cloudinaryId: Joi.string()
    .optional()
    .messages({
      'string.empty': 'Cloudinary ID must not be empty if provided'
    }),
  salary: Joi.string()
    .max(50)
    .optional(),
  requirements: Joi.string()
    .max(3000)
    .optional(),
  responsibilities: Joi.string()
    .max(3000)
    .optional(),
  applicationUrl: Joi.string()
    .uri()
    .optional(),
  applicationEmail: Joi.string()
    .email()
    .optional(),
  status: Joi.string()
    .valid('active', 'closed')
    .optional(),
  deadline: Joi.date()
    .iso()
    .allow('')
    .optional()
});

/**
 * Validate job creation data
 */
const validateJobCreation = (req, res, next) => {
  const { error } = jobCreationSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Joi Schema: Job Update (all fields optional)
 */
const jobUpdateSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Title must be between 3 and 100 characters if provided',
      'string.max': 'Title must be between 3 and 100 characters if provided'
    }),
  company: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Company name must not be empty and cannot exceed 100 characters',
      'string.max': 'Company name must not be empty and cannot exceed 100 characters'
    }),
  location: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Location must not be empty and cannot exceed 100 characters',
      'string.max': 'Location must not be empty and cannot exceed 100 characters'
    }),
  description: Joi.string()
    .min(50)
    .max(5000)
    .optional()
    .messages({
      'string.min': 'Description must be between 50 and 5000 characters if provided',
      'string.max': 'Description must be between 50 and 5000 characters if provided'
    }),
  category: Joi.string().optional(),
  jobType: Joi.string()
    .valid('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Remote')
    .optional(),
  experience: Joi.string().optional(),
  posterImage: Joi.string()
    .uri()
    .optional(),
  cloudinaryId: Joi.string().optional(),
  salary: Joi.string()
    .max(50)
    .optional(),
  requirements: Joi.string()
    .max(3000)
    .optional(),
  responsibilities: Joi.string()
    .max(3000)
    .optional(),
  applicationUrl: Joi.string()
    .uri()
    .optional(),
  applicationEmail: Joi.string()
    .email()
    .optional(),
  status: Joi.string()
    .valid('active', 'closed')
    .optional(),
  deadline: Joi.date()
    .iso()
    .allow('')
    .optional()
});

/**
 * Validate job update data
 */
const validateJobUpdate = (req, res, next) => {
  const { error } = jobUpdateSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // MongoDB ObjectId validation regex
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    next();
  };
};

/**
 * NOTE: sanitizeStrings has been REMOVED.
 * 
 * Reason: We now use the stronger sanitizeMiddleware with sanitize-html
 * that completely removes ALL HTML tags (not just regex patterns).
 * 
 * See: middleware/sanitizeMiddleware.js
 * Applied in: routes after multer processing
 */

module.exports = {
  validateLogin,
  validateAdminRegistration,
  validateJobCreation,
  validateJobUpdate,
  validateObjectId
};
