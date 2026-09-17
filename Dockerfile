# Single-container Dockerfile for forge-omix
# Serves frontend (nginx) + backend (Hono) in one container

FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Enable corepack and install dependencies
RUN corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build frontend
RUN pnpm build

# Build backend
RUN pnpm build:server

# Production stage
FROM node:22-alpine

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy built backend
COPY --from=builder /app/dist-server ./dist-server

# Copy package.json and node_modules for server
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create data directory
RUN mkdir -p /data/projects /data/templates /data/exports

# Expose port
EXPOSE 8080

# Start script: run nginx + hono backend
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
