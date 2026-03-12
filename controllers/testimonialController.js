const Testimonial = require('../models/Testimonial');

// Create new testimonial
const createTestimonial = async (req, res) => {
  try {
    const { name, email, company, message, rating } = req.body;

    if (!name || !message) {
      return res.status(400).json({ success: false, message: 'Name and message are required' });
    }

    const newTestimonial = new Testimonial({
      name,
      email,
      company,
      message,
      rating: Number(rating) || 5,
    });

    await newTestimonial.save();

    return res.status(201).json({ success: true, data: newTestimonial });
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error({ err: error }, 'createTestimonial error');
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get testimonials (public)
const getTestimonials = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const testimonials = await Testimonial.find().sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ success: true, data: testimonials });
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error({ err: error }, 'getTestimonials error');
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createTestimonial, getTestimonials };
