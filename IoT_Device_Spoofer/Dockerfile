# Build React frontend
FROM node:18 AS frontend
WORKDIR /src
COPY frontend/ .
RUN npm install && npm run build

# Build backend
FROM node:18 AS backend
WORKDIR /src
COPY backend/ .
RUN npm install && npm run build

# Final runtime image
FROM node:18
WORKDIR /app

# Copy backend dist
COPY --from=backend /src/dist ./backend
COPY --from=backend /src/package.json ./backend/package.json
COPY --from=backend /src/node_modules ./backend/node_modules

# Copy frontend build
COPY --from=frontend /src/dist ./frontend

EXPOSE 8080
CMD ["node", "backend/server.js"]
