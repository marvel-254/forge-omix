# 10 — Docker Deployment

## 10.1 Architecture

Single-container deployment. The Node.js process serves both the API and the frontend assets. LibSQL runs embedded in the application.

```
┌─────────────────────────────────────────┐
│           Docker Container               │
│  ┌───────────────────────────────────┐  │
│  │     Node.js 22 (Hono server)      │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │      API Routes              │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Static File Server         │  │  │
│  │  │   (Vite-built frontend)      │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   LibSQL (embedded)          │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│                                          │
│  Volumes:                                │
│  - /data/projects/                       │
│  - /data/templates/                      │
│  - /data/exports/                        │
│  - /data/forge.db (LibSQL database)      │
│                                          │
│  Ports:                                  │
│  - 3000 (HTTP)                           │
└─────────────────────────────────────────┘
```

## 10.2 Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
RUN pnpm build

# Build backend
RUN pnpm build:server

# Production stage
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S forge && \
    adduser -S forge -u 1001 -G forge

WORKDIR /app

# Copy built assets
COPY --from=builder --chown=forge:forge /app/dist ./dist
COPY --from=builder --chown=forge:forge /app/dist-server ./dist-server
COPY --from=builder --chown=forge:forge /app/node_modules ./node_modules
COPY --from=builder --chown=forge:forge /app/package.json ./package.json

# Create data directory
RUN mkdir -p /data/projects /data/templates /data/exports && \
    chown -R forge:forge /data

USER forge

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist-server/index.js"]
```

## 10.3 docker-compose.yml

```yaml
version: "3.8"

services:
  forge:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: forge-omix
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/data/forge.db
      - AI_MODE=${AI_MODE:-local}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
      - OLLAMA_BASE_URL=${OLLAMA_BASE_URL:-http://localhost:11434}
    volumes:
      - forge-data:/data
    networks:
      - forge-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "1.0"
        reservations:
          memory: 128M
          cpus: "0.25"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:size=64M

volumes:
  forge-data:
    driver: local

networks:
  forge-network:
    driver: bridge
```

## 10.4 .env.example

```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=file:/data/forge.db

# AI Configuration
AI_MODE=local                    # 'local' (Ollama) or 'cloud' (OpenRouter)
OPENROUTER_API_KEY=sk-or-...     # Required if AI_MODE=cloud
OLLAMA_BASE_URL=http://localhost:11434

# Security
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=change-me-to-a-random-string

# Storage
MAX_UPLOAD_SIZE=10mb
MAX_PROJECT_SIZE=50mb

# Logging
LOG_LEVEL=info                   # debug, info, warn, error

# Feature flags
ENABLE_AI=true
ENABLE_GIT=true
ENABLE_TEMPLATES=true
```

## 10.5 Volume Strategy

| Volume | Path | Purpose | Backup Priority |
|--------|------|---------|-----------------|
| Projects | `/data/projects/` | User project files | **Critical** |
| Templates | `/data/templates/` | Imported templates | Medium |
| Exports | `/data/exports/` | Generated code exports | Low (regenerable) |
| Database | `/data/forge.db` | All metadata | **Critical** |

### Volume Backup Script

```bash
#!/bin/bash
# backup.sh — Run via cron
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Stop container for consistent backup
docker stop forge-omix

# Copy volumes
docker run --rm -v forge-omix_forge-data:/data -v "$BACKUP_DIR":/backup alpine \
  tar czf /backup/forge-data.tar.gz -C /data .

# Restart
docker start forge-omix

# Keep only last 7 backups
ls -1t /backups/ | tail -n +8 | xargs -I{} rm -rf /backups/{}

echo "Backup complete: $BACKUP_DIR"
```

### Volume Restore Script

```bash
#!/bin/bash
# restore.sh — Restore from backup
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh /path/to/backup.tar.gz"
  exit 1
fi

docker stop forge-omix

docker run --rm -v forge-omix_forge-data:/data -v "$(dirname $BACKUP_FILE)":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/$(basename $BACKUP_FILE) -C /data --strip-components=1"

docker start forge-omix
echo "Restore complete"
```

## 10.6 Health Checks

### Application Health Endpoint

```typescript
// src/server/routes/health.ts
import { Hono } from 'hono';

const health = new Hono();

health.get('/', async (c) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabase(),
    disk: await checkDiskSpace(),
  };

  const isHealthy = checks.database.connected && checks.disk.sufficient;

  return c.json(checks, isHealthy ? 200 : 503);
});

async function checkDatabase() {
  try {
    await db.run('SELECT 1');
    return { connected: true };
  } catch {
    return { connected: false };
  }
}

async function checkDiskSpace() {
  const { execSync } = require('child_process');
  try {
    const output = execSync('df -h /data --output=avail | tail -1').toString().trim();
    const available = parseInt(output);
    return { sufficient: available > 100_000_000, available: output }; // > 100MB
  } catch {
    return { sufficient: true, available: 'unknown' };
  }
}

export default health;
```

### Docker Healthcheck

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

## 10.7 Security Hardening

### Container Security

```yaml
# Security options in docker-compose.yml
security_opt:
  - no-new-privileges:true    # Prevent privilege escalation
read_only: true              # Read-only root filesystem
tmpfs:
  - /tmp:size=64M            # Writable temp directory
cap_drop:
  - ALL                       # Drop all Linux capabilities
cap_add:
  - CHOWN                     # Only if needed for file ownership
deploy:
  resources:
    limits:
      memory: 512M            # Memory limit
      pids: 100                # Process limit
```

### Network Security

1. **No exposed database port** — LibSQL is embedded, no network access
2. **Internal volume only** — No host bind mounts required
3. **Bridge network** — Isolated from other containers
4. **Rate limiting** — Hono middleware limits requests

### Image Security

```dockerfile
# Scan for vulnerabilities
# docker scout cves forge-omix:latest

# Sign image (optional)
# docker trust sign forge-omix:latest
```

## 10.8 Upgrade Strategy

### Zero-Downtime Upgrade Process

```bash
# 1. Backup
./backup.sh

# 2. Pull latest image
docker pull forge-omix:latest

# 3. Run pre-upgrade migrations (if any)
docker compose run --rm forge npx drizzle-kit migrate

# 4. Rolling update
docker compose up -d --build

# 5. Verify
docker compose ps
docker compose logs -f forge

# 6. Verify health
curl http://localhost:3000/health
```

### Schema Migration on Upgrade

```typescript
// src/server/db/migrate.ts
import { migrate } from 'drizzle-orm/libsql/migrator';

export async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations complete');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
```

### Rollback Plan

```bash
# If upgrade fails:
docker stop forge-omix
docker rm forge-omix

# Restore from backup
./restore.sh /backups/latest/forge-data.tar.gz

# Start previous version
docker tag forge-omix:previous forge-omix:latest
docker compose up -d
```

## 10.9 Reverse Proxy (Production)

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/forge-omix
server {
    listen 80;
    server_name builder.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name builder.example.com;

    ssl_certificate /etc/letsencrypt/live/builder.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/builder.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://openrouter.ai;" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 256;

    # Proxy to container
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

    # Health check (no logging)
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Caddy Configuration (Alternative)

```caddyfile
# Caddyfile
builder.example.com {
    reverse_proxy localhost:3000
    
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    encode gzip
    
    @static {
        path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2
    }
    header @static Cache-Control "public, max-age=31536000, immutable"
}
```

## 10.10 SSL/TLS

### Let's Encrypt (Automated)

```bash
# Using certbot with Nginx
sudo certbot --nginx -d builder.example.com

# Auto-renewal (certbot installs timer automatically)
sudo certbot renew --dry-run
```

### Self-Signed (Development)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/forge.key \
  -out /etc/ssl/certs/forge.crt \
  -subj "/C=US/ST=State/L=City/O=Dev/CN=localhost"
```

## 10.11 Monitoring

### Container Metrics

```bash
# View resource usage
docker stats forge-omix

# View logs
docker compose logs -f forge

# Inspect health
docker inspect --format='{{.State.Health.Status}}' forge-omix
```

### Application Metrics (Optional)

```typescript
// src/server/metrics.ts
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

collectDefaultMetrics();

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

const aiRequestCount = new Counter({
  name: 'ai_requests_total',
  help: 'Total AI requests',
  labelNames: ['provider', 'model'],
});

app.get('/metrics', async (c) => {
  c.header('Content-Type', register.contentType);
  return c.text(await register.metrics());
});
```

## 10.12 Deployment Checklist

- [ ] Docker installed (20.10+)
- [ ] Docker Compose installed (v2.0+)
- [ ] `.env` file created with required values
- [ ] Port 3000 available
- [ ] Volume space > 1GB
- [ ] HTTPS configured (if public)
- [ ] Backups scheduled (cron)
- [ ] Monitoring enabled (optional)
