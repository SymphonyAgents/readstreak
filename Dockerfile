# Multi-stage build for ReadStreak Expo web app

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy app source
COPY . .

# Build Expo web app
RUN npm run build:web || npx expo export --platform web

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install serve to run the static app
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Create a simple Node server to serve the app
RUN echo '#!/bin/sh\nserve -s dist -l ${PORT:-3000}' > /app/start.sh && chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000), (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the server
CMD ["sh", "/app/start.sh"]
