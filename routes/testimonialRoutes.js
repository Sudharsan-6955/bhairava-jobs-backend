const express = require('express');
const router = express.Router();
const sanitizeMiddleware = require('../middleware/sanitizeMiddleware');
const { createTestimonial, getTestimonials } = require('../controllers/testimonialController');

// Public routes
router.get('/', getTestimonials);
router.post('/', sanitizeMiddleware, createTestimonial);

module.exports = router;
