const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB with secure configuration
 * Implements connection pooling and error handling
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Security and performance options
      maxPoolSize: 10, // Connection pooling
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info({ host: conn.connection.host }, 'MongoDB connected');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

  } catch (error) {
    logger.error({ err: error && error.message }, 'Error connecting to MongoDB');
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
