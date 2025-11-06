const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens from cookies or Authorization header
 */

/**
 * Verify JWT token and extract user information
 * Supports both cookie-based and header-based authentication
 */
const verifyToken = (req, res, next) => {
  try {
    // Try to get token from cookie first (preferred method)
    let token = req.cookies?.token;

    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    // Attach user info to request object
    req.user = {
      id: decoded.id || decoded.userId || decoded.sub,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role || 'user',
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Token verification failed',
    });
  }
};

/**
 * Optional authentication middleware
 * Verifies token if present, but doesn't fail if missing
 * Useful for endpoints that have different behavior for authenticated users
 */
const optionalAuth = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, jwtSecret);

    req.user = {
      id: decoded.id || decoded.userId || decoded.sub,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role || 'user',
    };

    next();
  } catch (error) {
    // Token verification failed, continue without authentication
    req.user = null;
    next();
  }
};

/**
 * Admin role verification middleware
 * Requires user to be authenticated and have admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
};
