# Build React frontend
FROM node:20-alpine AS frontend
WORKDIR /src
COPY frontend/ .
RUN npm install && npm run build

# Build backend
FROM node:20-alpine AS backend
WORKDIR /src
COPY backend/ .
RUN npm install && npm run build

# Final runtime image
FROM node:20-alpine
WORKDIR /app

# Copy backend dist
COPY --from=backend /src/dist ./backend
COPY --from=backend /src/package.json ./backend/package.json
COPY --from=backend /src/node_modules ./backend/node_modules

# Copy frontend build
COPY --from=frontend /src/dist ./frontend

# Create data directory and declare volume
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 8080
CMD ["node", "backend/server.js"]
