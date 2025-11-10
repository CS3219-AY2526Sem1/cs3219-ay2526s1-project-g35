FROM node:20-alpine

RUN apk add --no-cache python3 make g++ \
    && apk add --no-cache curl

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8005

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8005/health || exit 1

CMD ["npm", "start"]
