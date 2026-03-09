const jwt = require('jsonwebtoken');

/**
 * Generate JWT Access Token
 * Short-lived token for authentication (15 minutes)
 * @param {string} adminId - Admin's MongoDB ObjectId
 * @returns {string} JWT access token
 */
const generateAccessToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_ACCESS_SECRET,
    { 
      expiresIn: '15m', // 15 minutes for security
      issuer: 'job-platform-api',
      audience: 'job-platform-admin'
    }
  );
};

/**
 * Generate JWT Refresh Token
 * Long-lived token for obtaining new access tokens (7 days)
 * @param {string} adminId - Admin's MongoDB ObjectId
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: '7d', // 7 days
      issuer: 'job-platform-api',
      audience: 'job-platform-admin'
    }
  );
};

/**
 * Verify JWT Access Token
 * @param {string} token - JWT access token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      issuer: 'job-platform-api',
      audience: 'job-platform-admin'
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Verify JWT Refresh Token
 * @param {string} token - JWT refresh token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'job-platform-api',
      audience: 'job-platform-admin'
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Set HTTP-only cookie with access token
 * Secure, SameSite strict to prevent CSRF attacks
 * @param {object} res - Express response object
 * @param {string} token - JWT access token
 */
const setAccessTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true, // Prevent XSS attacks
    secure: isProduction, // HTTPS only in production
    // In production the frontend is on a different origin (Vercel),
    // so cookies must be sent with SameSite=None and Secure to be accepted.
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    path: '/'
  };

  res.cookie('accessToken', token, cookieOptions);
};

/**
 * Set HTTP-only cookie with refresh token
 * Longer expiration, restricted path
 * @param {object} res - Express response object
 * @param {string} token - JWT refresh token
 */
const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/api/auth/refresh' // Restrict to refresh endpoint only
  };

  res.cookie('refreshToken', token, cookieOptions);
};

/**
 * Clear authentication cookies
 * Used during logout
 * @param {object} res - Express response object
 */
const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    expires: new Date(0),
    path: '/'
  });
  
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    expires: new Date(0),
    path: '/api/auth/refresh'
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies
};
