# --- Build Stage for Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY apps/frontend/package*.json ./
RUN npm install
COPY apps/frontend/ ./
RUN npm run build

# --- Runtime Stage for Backend + Bot ---
FROM node:20-alpine

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
# Copy backend code
COPY apps/backend/package*.json ./apps/backend/
RUN cd apps/backend && npm install
COPY apps/backend ./apps/backend

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./apps/frontend/dist

# Expose port and start
EXPOSE 4000
CMD ["node", "apps/backend/src/index.js"]
