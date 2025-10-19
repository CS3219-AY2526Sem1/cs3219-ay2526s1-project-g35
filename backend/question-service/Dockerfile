FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ wget

WORKDIR /app

COPY package*.json ./

# Install production dependencies only 
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership of application files to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 8001 for container orchestration
EXPOSE 8001

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8001/health || exit 1

# Start application using npm start 
CMD ["npm", "start"]
