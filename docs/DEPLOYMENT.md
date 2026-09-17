# Deployment Guide — Render + Docker

## Current Status

- **GitHub Repo:** https://github.com/marvel-254/forge-omix
- **CI:** GitHub Actions (typecheck, lint, tests, build)
- **Container Registry:** GitHub Container Registry (ghcr.io)
- **Automation:** Typecheck + lint + tests every 4 hours

## Render Setup (Required Before Deploy)

### 1. Authenticate Render CLI

```bash
render login
```

This opens a browser for OAuth. Use the account: `twistedoliver211fs@gmail.com`

### 2. Create Render Service

```bash
# Option A: From Docker image (ghcr.io)
render create service \
  --name forge-omix \
  --image ghcr.io/marvel-254/forge-omix:latest \
  --env PORT=8080 \
  --plan free

# Option B: From Docker Compose (if using postgres)
render create compose \
  --name forge-omix \
  --repository https://github.com/marvel-254/forge-omix
```

### 3. Environment Variables (Render Dashboard)

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `8080` | Render exposes this |
| `DATABASE_URL` | `` | LibSQL file path or remote |
| `NODE_ENV` | `production` | |

## Docker Registry Push

The `docker.yml` workflow automatically pushes to ghcr.io on version tags:

```bash
# To trigger Docker build & push:
git tag v0.1.0
git push origin master --tags
```

Image will be available at: `ghcr.io/marvel-254/forge-omix:v0.1.0`

## Local Docker Build & Test

```bash
# Build locally
docker build -t forge-omix .

# Run locally
docker run -p 8080:8080 --env PORT=8080 forge-omix

# Push manually to ghcr.io
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin
docker tag forge-omix ghcr.io/marvel-254/forge-omix:latest
docker push ghcr.io/marvel-254/forge-omix:latest
```

## Render CLI Commands

```bash
# List services
render services

# View logs
render logs forge-omix

# Deploy new version (from latest image)
render deploy forge-omix

# Delete service
render delete forge-omix --yes
```