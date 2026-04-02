# Multi-stage build for ReadStreak Expo web app

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy app source (dist/ is gitignored so it won't be in the archive; build from source)
COPY . .

# Build Expo web app (outputs to ./dist)
RUN npx expo export --platform web

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve@14

# Copy built static output from builder
COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT env var — serve listens on it
CMD sh -c "serve -s dist -l ${PORT:-3000}"
