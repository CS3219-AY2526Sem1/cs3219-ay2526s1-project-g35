FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose ports
EXPOSE 8004 8005

# Start the application
CMD ["node", "src/app.js"]
