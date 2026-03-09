const sanitizeHtml = require('sanitize-html');

/**
 * Production-Ready XSS Protection Middleware
 * 
 * Security Features:
 * - COMPLETELY REMOVES all HTML tags (not escaped, DELETED)
 * - Strips <script>, inline events (onclick, onerror, etc.)
 * - Removes null bytes and control characters
 * - Deep sanitization of nested objects/arrays
 * - Preserves numbers, booleans, and file uploads (Buffers)
 * 
 * Why 'discard' mode:
 * - 'recursiveEscape': Converts <script> to &lt;script&gt; (still stored in DB)
 * - 'discard': Completely removes <script> tags (safer, cleaner data)
 */

/**
 * Strict sanitize-html configuration
 * Removes ALL HTML completely before database storage
 */
const sanitizeConfig = {
  allowedTags: [],              // ✅ NO HTML tags allowed
  allowedAttributes: {},        // ✅ NO attributes allowed
  allowedSchemes: [],           // ✅ Block javascript:, data: URLs
  disallowedTagsMode: 'discard', // ✅ REMOVE tags completely (not escape)
  
  // Additional protections
  allowProtocolRelative: false,  // Block //evil.com
  enforceHtmlBoundary: false,    // Process all text
  
  // Text transforms - strip dangerous patterns
  textFilter: (text) => {
    return text
      .replace(/javascript:/gi, '')         // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '')           // Remove inline events (onclick=, onerror=)
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control chars & null bytes
  }
};

/**
 * Deep sanitization of input data
 * Recursively processes objects, arrays, and strings
 * @param {*} input - Data to sanitize
 * @returns {*} - Clean sanitized data
 */
const sanitizeInput = (input) => {
  // Preserve null and undefined
  if (input === null || input === undefined) {
    return input;
  }

  // Skip Buffer objects (file uploads - DO NOT TOUCH)
  if (Buffer.isBuffer(input)) {
    return input;
  }

  // Sanitize strings - REMOVE all HTML tags
  if (typeof input === 'string') {
    const trimmed = input.trim();
    
    // Empty strings after trimming
    if (!trimmed) {
      return trimmed;
    }
    
    // Apply sanitize-html with strict config
    const cleaned = sanitizeHtml(trimmed, sanitizeConfig);
    
    // Additional safety: strip any remaining dangerous patterns
    return cleaned
      .replace(/<[^>]*>/g, '')              // Remove any remaining tags
      .replace(/javascript:/gi, '')          // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '');          // Remove event handlers
  }

  // Recursively sanitize arrays
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }

  // Recursively sanitize objects
  if (typeof input === 'object') {
    const sanitized = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        // Sanitize both key and value
        const cleanKey = typeof key === 'string' ? key.replace(/[.$]/g, '') : key; // Remove MongoDB operators
        sanitized[cleanKey] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }

  // Return primitives unchanged (numbers, booleans, etc.)
  return input;
};

/**
 * Express middleware to sanitize all incoming requests
 * Processes req.body, req.query, and req.params before reaching controllers
 * 
 * Usage: app.use(sanitizeMiddleware);
 */
const sanitizeMiddleware = (req, res, next) => {
  try {
    // Sanitize request body (POST, PUT, PATCH)
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeInput(req.body);
    }

    // Sanitize query parameters (GET)
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeInput(req.query);
    }

    // Sanitize URL parameters (route params)
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeInput(req.params);
    }

    next();
  } catch (error) {
    console.error('❌ Sanitization error:', error);
    
    // Don't expose internal errors to clients in production
    return res.status(500).json({
      success: false,
      message: 'Invalid request data format'
    });
  }
};

module.exports = sanitizeMiddleware;
