FROM node:20

WORKDIR /app

# --- API BUILD ---
# Copy API package files
COPY api ./

# Install API dependencies (including devDependencies for build)
RUN npm install

# Build API
RUN npm run build

# --- UI BUILD ---
# Copy UI source code to a temporary location
COPY ui/ /tmp/ui/

# Install UI dependencies and build
RUN cd /tmp/ui && \
    npm ci && \
    VITE_API_URL=/ npm run build

# Move built UI assets to the expected location
RUN mkdir -p ui/dist && \
    cp -r /tmp/ui/dist/* ui/dist/ && \
    rm -rf /tmp/ui

# --- CLEANUP ---
# Remove devDependencies to keep the image smaller
RUN npm prune --omit=dev

ENV UI_PATH=/app/ui/dist

# Expose port
EXPOSE 3000

# Start the API server
CMD ["node", "dist/server.js"]

