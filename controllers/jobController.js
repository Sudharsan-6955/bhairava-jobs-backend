const Job = require('../models/Job');
const { deleteFromCloudinary } = require('../config/cloudinary');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Create a new job
 * @route   POST /api/jobs
 * @access  Private/Admin
 */
const createJob = asyncHandler(async (req, res) => {
  if (!req.admin || !req.admin._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login again.'
    });
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Invalid request body'
    });
  }

  const {
    title,
    company,
    location,
    jobType,
    experience,
    salary,
    description,
    requirements,
    responsibilities,
    category,
    applicationUrl,
    applicationEmail,
    deadline,
    status,
    posterImage,
    cloudinaryId
  } = req.body;

  if (!posterImage) {
    return res.status(400).json({
      success: false,
      message: 'Poster image is required'
    });
  }

  try {
    const job = await Job.create({
      title,
      company,
      location,
      jobType,
      experience,
      salary,
      description,
      requirements,
      responsibilities,
      category,
      applicationUrl,
      applicationEmail,
      deadline,
      status: status || 'active',
      posterImage,
      cloudinaryId,
      createdBy: req.admin._id
    });

    return res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map((fieldError) => fieldError.message)
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    Get all jobs with pagination and filters
 * @route   GET /api/jobs
 * @access  Public
 */
const getAllJobs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    includeDeleted,
    category,
    jobType,
    location,
    company,
    search,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build query
  const query = {};
  const isAdminUser = req.admin && (req.admin.role === 'admin' || req.admin.role === 'superadmin');
  const shouldIncludeDeleted = isAdminUser && String(includeDeleted).toLowerCase() === 'true';

  // IMPORTANT: Default to active jobs for public users
  // Admins and superadmins can override status filter
  if (isAdminUser && status) {
    // Admin/Superadmin explicitly filtering by status
    query.status = status;
  } else {
    // Public users always see only active jobs
    query.status = 'active';
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by job type
  if (jobType) {
    query.jobType = jobType;
  }

  // Filter by location (case-insensitive partial match)
  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  // Filter by company (case-insensitive partial match)
  if (company) {
    query.company = { $regex: company, $options: 'i' };
  }

  // Text search in title and description
  if (search) {
    query.$text = { $search: search };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = order === 'asc' ? 1 : -1;

  try {
    // Execute query with pagination
    const jobs = await Job.find(query)
      .setOptions({ includeDeleted: shouldIncludeDeleted })
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('createdBy', 'name email')
      .lean();

    // Get total count for pagination
    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    Get single job by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('createdBy', 'name email');

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Increment view count (only for non-admin users)
  if (!req.admin) {
    job.views += 1;
    await job.save();
  }

  res.status(200).json({
    success: true,
    data: job
  });
});

/**
 * @desc    Update job
 * @route   PUT /api/jobs/:id
 * @access  Private/Admin
 */
const updateJob = asyncHandler(async (req, res) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Check if admin can update this job
  // Superadmin can update any job, regular admin can only update their own
  if (req.admin.role !== 'superadmin' && job.createdBy.toString() !== req.admin._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this job'
    });
  }

  // If new poster image is uploaded, delete old one from Cloudinary
  if (req.body.posterImage && req.body.posterImage !== job.posterImage && job.cloudinaryId) {
    try {
      await deleteFromCloudinary(job.cloudinaryId);
    } catch (error) {
      console.error('Error deleting old image from Cloudinary:', error);
    }
  }

  // Update job
  job = await Job.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Job updated successfully',
    data: job
  });
});

/**
 * @desc    Delete job (soft delete)
 * @route   DELETE /api/jobs/:id
 * @access  Private/Admin
 */
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).select('+cloudinaryId');

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Check if admin can delete this job
  if (req.admin.role !== 'superadmin' && job.createdBy.toString() !== req.admin._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this job'
    });
  }

  // Soft delete (mark as deleted instead of removing from database)
  job.isDeleted = true;
  job.status = 'closed';
  await job.save();

  // Optionally delete image from Cloudinary
  if (job.cloudinaryId) {
    try {
      await deleteFromCloudinary(job.cloudinaryId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Job deleted successfully'
  });
});

/**
 * @desc    Permanently delete job
 * @route   DELETE /api/jobs/:id/permanent
 * @access  Private/Superadmin
 */
const permanentlyDeleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).select('+cloudinaryId');

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Delete image from Cloudinary
  if (job.cloudinaryId) {
    try {
      await deleteFromCloudinary(job.cloudinaryId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }

  // Permanently delete from database
  await Job.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Job permanently deleted'
  });
});

/**
 * @desc    Get job statistics
 * @route   GET /api/jobs/stats/overview
 * @access  Private/Admin
 */
const getJobStats = asyncHandler(async (req, res) => {
  const stats = await Job.aggregate([
    {
      $match: { isDeleted: { $ne: true } }
    },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        activeJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        closedJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
        },
        totalViews: { $sum: '$views' },
        totalShares: { $sum: '$shares' }
      }
    }
  ]);

  // Category breakdown
  const categoryStats = await Job.aggregate([
    {
      $match: { isDeleted: { $ne: true }, status: 'active' }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Recent jobs
  const recentJobs = await Job.find({ isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title company status createdAt views')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalJobs: 0,
        activeJobs: 0,
        closedJobs: 0,
        totalViews: 0,
        totalShares: 0
      },
      categoryBreakdown: categoryStats,
      recentJobs
    }
  });
});

/**
 * @desc    Increment job share count
 * @route   POST /api/jobs/:id/share
 * @access  Public
 */
const incrementShareCount = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  await job.incrementShares();

  res.status(200).json({
    success: true,
    message: 'Share count updated'
  });
});

/**
 * @desc    Get jobs by category
 * @route   GET /api/jobs/category/:category
 * @access  Public
 */
const getJobsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const jobs = await Job.find({
    category,
    status: 'active'
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await Job.countDocuments({ category, status: 'active' });

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: jobs
  });
});

/**
 * @desc    Search jobs
 * @route   GET /api/jobs/search
 * @access  Public
 */
const searchJobs = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const skip = (page - 1) * limit;

  // Text search with score sorting
  const jobs = await Job.find(
    {
      $text: { $search: q },
      status: 'active'
    },
    {
      score: { $meta: 'textScore' }
    }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await Job.countDocuments({
    $text: { $search: q },
    status: 'active'
  });

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    query: q,
    data: jobs
  });
});

module.exports = {
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
};
