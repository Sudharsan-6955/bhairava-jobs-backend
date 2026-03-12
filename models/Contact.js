const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [200, 'Full name cannot exceed 200 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    maxlength: [200, 'Email cannot exceed 200 characters'],
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  contactNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Contact number cannot exceed 50 characters']
  },
  qualification: {
    type: String,
    trim: true,
    maxlength: [200, 'Qualification cannot exceed 200 characters']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  ip: {
    type: String,
    select: false
  },
  userAgent: {
    type: String,
    select: false
  }
  ,
  browser: {
    type: String,
    select: false
  },
  os: {
    type: String,
    select: false
  },
  device: {
    type: String,
    select: false
  },
  country: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);
