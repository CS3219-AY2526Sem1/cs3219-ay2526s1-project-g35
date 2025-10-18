# Stage: Base - Use Node.js 20 LTS Alpine for minimal footprint
# Alpine Linux reduces image size by ~70% compared to standard Node images
FROM node:20-alpine

# Install build dependencies for native modules (argon2 requires C++ compilation)
# python3, make, g++ needed for node-gyp to compile native dependencies
RUN apk add --no-cache python3 make g++

# Set working directory - all subsequent commands run from here
WORKDIR /app

# Copy dependency manifests first for better layer caching
# Docker caches layers, so if package.json hasn't changed, npm install is skipped
COPY package*.json ./

# Install production dependencies only (--omit=dev excludes devDependencies)
# This reduces final image size and attack surface
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
# Done after dependency installation to maximize cache hits during development
COPY . .

# Create non-root user for security (principle of least privilege)
# Running as root in containers is a security risk
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership of application files to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 8000 for container orchestration
# This is documentary - actual port binding happens at runtime
EXPOSE 8000

# Health check for container orchestration (Kubernetes liveness/readiness probes)
# Checks /health endpoint every 30s, waits 5s on startup, retries 3 times
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Start application using npm start (defined in package.json)
CMD ["npm", "start"]
