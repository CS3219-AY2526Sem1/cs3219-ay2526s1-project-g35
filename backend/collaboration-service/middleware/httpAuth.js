/**
 * HTTP Authentication Middleware
 * Verifies JWT tokens for REST API endpoints
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate HTTP requests using JWT
 */
const httpAuthMiddleware = (req, res, next) => {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.accessToken;

    if (!token) {
      // Allow through without auth for internal service calls
      // This is for service-to-service communication (matching service calling collaboration service)
      if (process.env.NODE_ENV !== 'production') {
        console.log('No auth token, allowing request in development mode');
        req.userId = req.headers['x-service-user'] || 'service';
        return next();
      }
      
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication token required' 
      });
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Attach user info to request
      req.userId = decoded.id || decoded.userId;
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        isAdmin: decoded.isAdmin,
      };
      
      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError.message);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Invalid token, allowing request in development mode');
        req.userId = req.headers['x-service-user'] || 'service';
        return next();
      }
      
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (process.env.NODE_ENV !== 'production') {
      req.userId = req.headers['x-service-user'] || 'service';
      return next();
    }
    
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

/**
 * Optional: Less strict auth for development
 */
const httpAuthMiddlewareDev = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.accessToken;
    const userId = req.headers['x-service-user'] || req.headers['x-user-id'];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.id || decoded.userId;
        req.user = {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
        };
      } catch (err) {
        console.warn('Token verification failed, using fallback auth');
        req.userId = userId || 'service';
        req.user = { id: req.userId, username: 'Service User' };
      }
    } else if (userId) {
      // Allow connection with just userId in dev mode
      req.userId = userId;
      req.user = { id: userId, username: 'Service User' };
    } else {
      // Allow through in dev mode
      req.userId = 'service';
      req.user = { id: 'service', username: 'Service User' };
    }

    next();
  } catch (error) {
    console.error('HTTP auth error:', error.message);
    req.userId = 'service';
    req.user = { id: 'service', username: 'Service User' };
    next();
  }
};

module.exports = {
  httpAuthMiddleware,
  httpAuthMiddlewareDev,
};

