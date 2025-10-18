/**
 * Socket.IO Authentication Middleware
 * Verifies JWT tokens before allowing socket connections
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate socket connections using JWT
 */
const socketAuthMiddleware = (socket, next) => {
  try {
    // Extract token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Attach user info to socket
    socket.userId = decoded.id || decoded.userId;
    socket.username = decoded.username || decoded.email;
    socket.userInfo = decoded;

    console.log(`✅ Socket authenticated: ${socket.userId}`);
    next();
  } catch (error) {
    console.error('Socket authentication failed:', error.message);
    next(new Error('Authentication failed'));
  }
};

/**
 * Optional: Less strict auth for development
 */
const socketAuthMiddlewareDev = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    const userId = socket.handshake.auth.userId || socket.handshake.query.userId;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.userId = decoded.id || decoded.userId;
        socket.username = decoded.username || decoded.email;
        socket.userInfo = decoded;
      } catch (err) {
        console.warn('Token verification failed, using fallback auth');
        socket.userId = userId || `guest-${socket.id}`;
        socket.username = `Guest ${socket.id.substring(0, 4)}`;
      }
    } else if (userId) {
      // Allow connection with just userId in dev mode
      socket.userId = userId;
      socket.username = `User ${userId}`;
    } else {
      socket.userId = `guest-${socket.id}`;
      socket.username = `Guest ${socket.id.substring(0, 4)}`;
    }

    console.log(`🔓 Socket connected (dev mode): ${socket.userId}`);
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication failed'));
  }
};

module.exports = {
  socketAuthMiddleware,
  socketAuthMiddlewareDev,
};
