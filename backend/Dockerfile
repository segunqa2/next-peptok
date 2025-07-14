# Multi-stage build for TypeScript backend
FROM node:18-alpine AS builder

# Install essential packages
RUN apk add --no-cache git python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for building)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install essential packages
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built JavaScript files from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 -G nodejs && \
    chown -R backend:nodejs /app

# Switch to non-root user
USER backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start server with dumb-init
CMD ["dumb-init", "node", "dist/server.js"]
