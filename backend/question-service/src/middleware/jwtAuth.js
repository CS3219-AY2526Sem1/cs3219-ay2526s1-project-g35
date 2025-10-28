const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware (Local Validation)
 * Validates JWT tokens locally without calling user-service
 *
 * This approach:
 * - Validates tokens in <1ms (no network call)
 * - Works even if user-service is down
 * - Uses the same JWT secret as user-service (shared secret)
 * - Standard microservices pattern
 */

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('⚠️  WARNING: JWT_SECRET not set! Authentication will fail.');
  console.error('   Set JWT_SECRET in environment variables (same as user-service)');
}

/**
 * Extract token from cookies
 */
const extractTokenFromCookies = (req) => {
  // Try accessToken cookie first (standard)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // Fallback to Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

/**
 * Middleware to verify JWT token locally
 * Validates token without calling user-service
 * User data is extracted from the JWT payload
 */
const verifyToken = (req, res, next) => {
  try {
    // Allow internal service-to-service calls if service-to-service token is provided
    const serviceToken = req.headers['x-service-token'];
    const expectedServiceToken = process.env.SERVICE_TO_SERVICE_TOKEN || 'internal-service-token';
    
    if (serviceToken === expectedServiceToken) {
      // Bypass authentication for internal service calls
      console.log('Internal service call authenticated');
      return next();
    }

    // Extract token
    const token = extractTokenFromCookies(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Access token is required. Please log in.',
      });
    }

    // Verify and decode token locally (no service call!)
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user data to request
    // Structure should match what user-service puts in JWT payload
    req.user = {
      id: decoded.id || decoded.userId,
      username: decoded.username,
      email: decoded.email,
      isAdmin: decoded.isAdmin || false,
      isVerified: decoded.isVerified || false,
    };
    req.userId = decoded.id || decoded.userId;

    next();
  } catch (error) {
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid token. Please log in again.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Token has expired. Please log in again.',
      });
    }

    // Other errors
    console.error('JWT verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'Failed to authenticate token.',
    });
  }
};

/**
 * Middleware to verify admin privileges
 * Should be used AFTER verifyToken
 * Checks isAdmin flag in JWT payload
 */
const verifyAdmin = (req, res, next) => {
  // Check if user object exists (should be set by verifyToken)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication required. Please log in.',
    });
  }

  // Check if user has admin privileges
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'INSUFFICIENT_PRIVILEGES',
      message: 'Admin privileges required to perform this action.',
    });
  }

  next();
};

/**
 * Optional: Middleware to refresh user data from user-service
 * Use this sparingly on critical operations where fresh data is needed
 */
const refreshUserData = async (req, res, next) => {
  try {
    const axios = require('axios');
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8000';

    // Get fresh user data from user-service
    const response = await axios.get(`${USER_SERVICE_URL}/users/${req.userId}`);

    // Update req.user with fresh data
    req.user = {
      ...req.user,
      ...response.data.data,
    };

    next();
  } catch (error) {
    // If refresh fails, continue with cached JWT data
    console.warn('Failed to refresh user data:', error.message);
    next();
  }
};

module.exports = {
  verifyToken,
  verifyAdmin,
  refreshUserData, // Optional - use only when fresh data is critical
};
