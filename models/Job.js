const mongoose = require('mongoose');

/**
 * Job Schema with validation and sanitization
 * All fields are validated to prevent injection attacks
 */
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    minlength: [3, 'Title must be at least 3 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: {
      values: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Remote'],
      message: 'Please select a valid job type'
    },
    default: 'Full-time'
  },
  experience: {
    type: String,
    required: [true, 'Experience level is required'],
    trim: true,
    maxlength: [50, 'Experience cannot exceed 50 characters']
  },
  salary: {
    type: String,
    trim: true,
    maxlength: [50, 'Salary cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
    minlength: [50, 'Description must be at least 50 characters']
  },
  requirements: {
    type: String,
    trim: true,
    maxlength: [3000, 'Requirements cannot exceed 3000 characters']
  },
  responsibilities: {
    type: String,
    trim: true,
    maxlength: [3000, 'Responsibilities cannot exceed 3000 characters']
  },
  posterImage: {
    type: String,
    required: [true, 'Job poster image is required'],
    validate: {
      validator: function(v) {
        // Validate Cloudinary URL or valid image URL
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v) || 
               /^https:\/\/res\.cloudinary\.com\/.+/.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  cloudinaryId: {
    type: String, // Store Cloudinary public_id for deletion
    select: false
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    trim: true
  },
  applicationUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Please provide a valid URL'
    }
  },
  applicationEmail: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  deadline: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return v > Date.now();
      },
      message: 'Deadline must be in the future'
    }
  },
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false // Soft delete flag
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ company: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ title: 'text', description: 'text' }); // Text search

/**
 * Virtual field to check if job is still accepting applications
 */
jobSchema.virtual('isActive').get(function() {
  if (this.status !== 'active') return false;
  if (this.deadline && this.deadline < Date.now()) return false;
  return true;
});

/**
 * Method to increment views counter
 */
jobSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

/**
 * Method to increment shares counter
 */
jobSchema.methods.incrementShares = async function() {
  this.shares += 1;
  return this.save();
};

/**
 * Query middleware to exclude soft-deleted jobs
 */
jobSchema.pre(/^find/, function() {
  // Exclude soft-deleted jobs unless explicitly requested
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

/**
 * Remove sensitive fields and add computed fields
 */
jobSchema.methods.toJSON = function() {
  const job = this.toObject();
  delete job.__v;
  delete job.isDeleted;
  return job;
};

module.exports = mongoose.model('Job', jobSchema);
