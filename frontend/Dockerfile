FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
# Install ALL dependencies
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for Next.js public env vars
ARG NEXT_PUBLIC_API_USER_URL
ARG NEXT_PUBLIC_API_QUESTION_URL
ARG NEXT_PUBLIC_API_MATCHING_URL
ARG NEXT_PUBLIC_WS_COLLAB_URL
ARG NEXT_PUBLIC_MATCHING_WS_URL

# Set them as environment variables for the build
ENV NEXT_PUBLIC_API_USER_URL=${NEXT_PUBLIC_API_USER_URL}
ENV NEXT_PUBLIC_API_QUESTION_URL=${NEXT_PUBLIC_API_QUESTION_URL}
ENV NEXT_PUBLIC_API_MATCHING_URL=${NEXT_PUBLIC_API_MATCHING_URL}
ENV NEXT_PUBLIC_WS_COLLAB_URL=${NEXT_PUBLIC_WS_COLLAB_URL}
ENV NEXT_PUBLIC_MATCHING_WS_URL=${NEXT_PUBLIC_MATCHING_WS_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Production runner using Node.js 
FROM node:20-alpine AS runner
WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run the standalone server
CMD ["node", "server.js"]
