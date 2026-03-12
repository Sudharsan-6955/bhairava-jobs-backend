const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: false, trim: true },
  company: { type: String, required: false, trim: true },
  message: { type: String, required: true, trim: true },
  rating: { type: Number, required: false, min: 0, max: 5, default: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', TestimonialSchema);
