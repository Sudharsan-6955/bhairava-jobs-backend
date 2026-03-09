const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const sanitizeMiddleware = require('./middleware/sanitizeMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Validate critical environment variables (fail fast)
const requiredEnvVars = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envName) => !process.env[envName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Hide framework signature
app.disable('x-powered-by');

// Trust first proxy in production (required for secure cookies/rate limits behind reverse proxy)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Normalize duplicate slashes in request paths (e.g. //jobs -> /jobs)
// This is safe and prevents accidental 404s when clients produce URLs with
// double slashes. It operates on `req.url` which excludes the host/protocol.
app.use((req, res, next) => {
  if (typeof req.url === 'string' && req.url.includes('//')) {
    req.url = req.url.replace(/\/\/{2,}/g, '/');
  }
  next();
});

/**
 * ====================
 * Security Middleware
 * ====================
 */

// Helmet - Set security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],  // ✅ SECURE - No unsafe-inline
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS - Cross-Origin Resource Sharing
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Morgan - HTTP Request Logging (ORDER TRACKING & DEBUGGING)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // Detailed logs for production
} else {
  app.use(morgan('dev'));      // Colored concise logs for development
}

// Rate Limiting - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  skip: (req) => req.path === '/auth/login' || req.path === '/auth/register',
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser());

// NoSQL Injection Protection - Sanitize MongoDB queries
app.use(mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  Sanitized key: ${key}`);
    }
  }
}));

// HTTP Parameter Pollution (HPP) Protection - Prevent parameter pollution attacks
app.use(hpp());

/**
 * ====================
 * XSS Protection Strategy
 * ====================
 * 
 * IMPORTANT: Global sanitization is REMOVED here.
 * 
 * Why? Multer processes multipart/form-data INSIDE routes,
 * populating req.body AFTER this global middleware runs.
 * 
 * Solution: Sanitization is applied at ROUTE level,
 * AFTER multer middleware in routes that handle file uploads.
 * 
 * See routes/jobRoutes.js and routes/authRoutes.js for implementation.
 */

/**
 * ====================
 * Routes
 * ====================
 */

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Job Upload Platform API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Mount routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));

/**
 * ====================
 * Error Handling
 * ====================
 */

// 404 Not Found handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

/**
 * ====================
 * Start Server
 * ====================
 */

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log(`
    🚀 Server running in ${NODE_ENV.toUpperCase().padEnd(11)} mode      
    📡 Port: ${PORT.toString().padEnd(37)}
    🌐 URL: http://localhost:${PORT.toString().padEnd(18)}  
  `);
});

/**
 * ====================
 * Graceful Shutdown
 * ====================
 */

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

// Handle SIGINT signal (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

module.exports = app;
