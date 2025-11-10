const jwt = require('jsonwebtoken');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8000';

const verifyToken = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken || req.cookies?.token;

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

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    try {
      const response = await axios.get(`${USER_SERVICE_URL}/auth/verify-token`, {
        headers: {
          Cookie: `accessToken=${token}`,
        },
      });

      if (response.data && response.data.data) {
        req.user = {
          id: response.data.data.id,
          email: response.data.data.email,
          username: response.data.data.username,
          isAdmin: response.data.data.isAdmin === true,
          role: response.data.data.isAdmin === true ? 'admin' : 'user',
        };
      } else {
        req.user = {
          id: decoded.id || decoded.userId || decoded.sub,
          email: decoded.email,
          username: decoded.username,
          isAdmin: false,
          role: decoded.role || 'user',
        };
      }
    } catch (verifyError) {
      console.error('User service verification error:', verifyError.message);
      req.user = {
        id: decoded.id || decoded.userId || decoded.sub,
        email: decoded.email,
        username: decoded.username,
        isAdmin: false,
        role: decoded.role || 'user',
      };
    }

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

const optionalAuth = (req, res, next) => {
  try {
    let token = req.cookies?.accessToken || req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
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
    req.user = null;
    next();
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    console.log('Admin endpoint accessed by user:', req.user.id);
    return next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during admin verification',
    });
  }
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
};
