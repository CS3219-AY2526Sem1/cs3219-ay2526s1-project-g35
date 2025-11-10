const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('⚠️  WARNING: JWT_SECRET not set for analytics-service. Authentication will fail.');
}

const extractToken = (req) => {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

const verifyToken = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Access token is required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id || decoded.userId,
      username: decoded.username,
      email: decoded.email,
      isAdmin: decoded.isAdmin || false,
      isVerified: decoded.isVerified || false,
    };
    req.userId = req.user.id;

    return next();
  } catch (error) {
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

    console.error('JWT verification failed:', error);
    return res.status(500).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'Failed to authenticate token.',
    });
  }
};

const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication required. Please log in.',
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'INSUFFICIENT_PRIVILEGES',
      message: 'Admin privileges required.',
    });
  }

  return next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
};
