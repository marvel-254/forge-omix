# Forge-Omix Hosting Research

## Project Requirements Summary

| Requirement | Detail |
|-------------|--------|
| **Stack** | React 18 + Vite 5 (frontend), Hono 4 (backend), Drizzle ORM + LibSQL (database) |
| **Deployment** | Single Docker container (Node.js 22 Alpine) |
| **Port** | 3000 |
| **Storage** | Persistent volumes for `/data/projects/`, `/data/templates/`, `/data/exports/`, `/data/forge.db` |
| **Build** | `pnpm build` (frontend) + `pnpm build:server` (backend) |
| **Health check** | `GET /health` on port 3000 |
| **Philosophy** | Lightweight, self-hostable, local-first, no heavy infrastructure |
| **User preference** | Simpler/faster builds over containerization; already uses Render for other projects |

---

## Hosting Options Comparison

### 1. Render (Recommended for V1)

| Aspect | Detail |
|--------|--------|
| **Free tier** | 750 hrs/month (spins down after 15 min inactivity) |
| **Paid** | $7/month (no spin-down) |
| **Docker support** | Native (Dockerfile or buildpack) |
| **Managed DB** | PostgreSQL (not needed - we use LibSQL embedded) |
| **Persistent disk** | Yes (on paid plans) |
| **Git deploys** | Yes (auto-deploy on push) |
| **Custom domain** | Yes |
| **CLI** | Yes (`render` CLI) |
| **Regions** | US East, US West, EU, Asia |
| **Cold start** | 30-60s on free tier (spin-down) |

**Pros:**
- Already used by user (htmg-hms) - familiar workflow
- Simplest Docker deployment (connect repo, done)
- Free tier is generous for development
- No credit card for static sites (required for web services)
- Automatic HTTPS
- Git-based deploys with preview environments

**Cons:**
- Free tier spins down after 15 min inactivity (30-60s cold start)
- Persistent disk only on paid plans ($7/mo)
- Not ideal for always-on services on free tier

**Best for:** V1 development, staging, low-traffic production

---

### 2. Fly.io

| Aspect | Detail |
|--------|--------|
| **Free tier** | 3 VMs (shared CPU, 256MB RAM) - trial only |
| **Paid** | ~$2/month per VM |
| **Docker support** | Native (Dockerfile or buildpack) |
| **Persistent disk** | Yes (volumes) |
| **Git deploys** | Yes (`fly deploy`) |
| **Custom domain** | Yes |
| **CLI** | Excellent (`flyctl`) |
| **Regions** | 30+ global regions |
| **Cold start** | Near-zero (VMs stay running) |

**Pros:**
- VMs stay running (no spin-down)
- Excellent CLI and developer experience
- Global edge deployment
- Persistent volumes on all plans
- Good for Docker Compose stacks
- Can run multiple services cheaply

**Cons:**
- Steeper learning curve than Render
- Free tier is trial-only (requires card)
- Networking config can be tricky
- Documentation is dense
- Postgres backups cost extra

**Best for:** Production with global reach, multi-service stacks

---

### 3. Railway

| Aspect | Detail |
|--------|--------|
| **Free tier** | $1/month credit (not truly free) |
| **Paid** | $5/month (Hobby, includes $5 credit) |
| **Docker support** | Native (Dockerfile or buildpack) |
| **Managed DB** | PostgreSQL, MySQL, Redis, MongoDB |
| **Persistent disk** | Yes |
| **Git deploys** | Yes (auto-deploy) |
| **Custom domain** | Yes |
| **CLI** | Yes (`railway` CLI) |
| **Regions** | US, EU, Asia |
| **Cold start** | Minimal |

**Pros:**
- Smoothest developer experience
- Platform builds image from Dockerfile
- Managed databases available
- Good for multi-service projects
- Clear, predictable pricing

**Cons:**
- Not truly free ($5/month minimum for usable tier)
- Usage-based pricing can surprise at scale
- Less control than raw VPS

**Best for:** Teams wanting managed experience, multi-service projects

---

### 4. Koyeb

| Aspect | Detail |
|--------|--------|
| **Free tier** | 1 web service (nano instance, 512MB RAM) |
| **Paid** | $2.69/month (nano) |
| **Docker support** | Native (Git or Docker image) |
| **Managed DB** | No (serverless Postgres available) |
| **Persistent disk** | No (use S3-compatible storage) |
| **Git deploys** | Yes |
| **Custom domain** | Yes |
| **CLI** | Yes (`koyeb` CLI) |
| **Regions** | US, EU, Asia, Africa (Nairobi!) |
| **Cold start** | Scale-to-zero (serverless) |

**Pros:**
- True serverless with scale-to-zero
- Free tier is generous (1 service forever)
- Built-in CDN and edge routing
- **Nairobi region** (closest to user in Kenya)
- Clean modern dashboard
- No credit card for free tier

**Cons:**
- No persistent disk (need external storage for LibSQL)
- No managed database
- Smaller community
- Free tier limited to one service
- Less mature than Render

**Best for:** Serverless-first architecture, low-traffic tools

---

### 5. Google Cloud Run

| Aspect | Detail |
|--------|--------|
| **Free tier** | 2M requests/month, 360K GB-seconds |
| **Paid** | Usage-based (per request + compute time) |
| **Docker support** | Native (container image) |
| **Managed DB** | Cloud SQL (separate cost) |
| **Persistent disk** | No (use GCS or Cloud Storage) |
| **Git deploys** | Yes (Cloud Build + Cloud Run) |
| **Custom domain** | Yes |
| **CLI** | Yes (`gcloud` CLI) |
| **Regions** | 30+ global regions |
| **Cold start** | 1-5s (scale-to-zero) |

**Pros:**
- Generous free tier (2M requests/month)
- Scale-to-zero (pay only for usage)
- Good for spiky traffic patterns
- Integrates with Google Cloud ecosystem

**Cons:**
- No persistent disk (need external storage)
- More complex setup than Render/Railway
- Vendor lock-in with Google Cloud
- Cold starts on scale-to-zero
- Not ideal for stateful applications

**Best for:** Event-driven workloads, APIs with variable traffic

---

### 6. Oracle Cloud Always Free

| Aspect | Detail |
|--------|--------|
| **Free tier** | 4 OCPUs, 24 GB RAM, 200 GB storage (forever free) |
| **Paid** | Pay-as-you-go |
| **Docker support** | Native (Docker Compose supported) |
| **Managed DB** | Autonomous Database (free tier) |
| **Persistent disk** | Yes (block storage) |
| **Git deploys** | Yes (via CLI or console) |
| **Custom domain** | Yes |
| **CLI** | Yes (`oci` CLI) |
| **Regions** | 12+ global regions |
| **Cold start** | None (always-on VMs) |

**Pros:**
- Most generous free tier (4 OCPUs, 24 GB RAM, 200 GB)
- Forever free (not a trial)
- Full VM control (Docker Compose stacks)
- Always-on (no spin-down)
- Can run multiple services

**Cons:**
- Steeper learning curve
- Console is complex
- Account verification can be tricky
- Less polished than Render/Railway
- Support is community-based

**Best for:** Self-hosting, full control, running multiple services

---

### 7. Coolify (Self-Hosted PaaS)

| Aspect | Detail |
|--------|--------|
| **Cost** | Free (open-source) |
| **Hosting** | Your own VPS (Hetzner, Contabo, etc.) |
| **Docker support** | Native (Docker Compose) |
| **Managed DB** | Yes (PostgreSQL, MySQL, Redis) |
| **Persistent disk** | Yes (on VPS) |
| **Git deploys** | Yes |
| **Custom domain** | Yes |
| **CLI** | Yes (`coolify` CLI) |
| **Regions** | Wherever your VPS is |
| **Cold start** | None (always-on) |

**Pros:**
- Full control over infrastructure
- Open-source (no vendor lock-in)
- Can host multiple projects on one VPS
- Managed databases included
- Git-based deploys
- Good for self-hosting

**Cons:**
- Requires VPS management
- You handle updates, security, backups
- Steeper learning curve
- VPS costs $5-10/month

**Best for:** Self-hosting, full control, cost efficiency at scale

---

### 8. Modal (GPU/Compute Layer)

| Aspect | Detail |
|--------|--------|
| **Free tier** | $30/month credits |
| **Paid** | Usage-based (per second) |
| **Docker support** | Native (container images) |
| **Persistent disk** | Volumes ($0.09/GiB/month) |
| **Git deploys** | Yes (via CLI) |
| **Custom domain** | Yes |
| **CLI** | Yes (`modal` CLI) |
| **Regions** | US, EU |
| **Cold start** | <2s (pre-warmed containers) |

**Pros:**
- GPU access for AI features
- Serverless (scale-to-zero)
- Good for compute-heavy tasks
- Pre-warmed containers (fast cold starts)

**Cons:**
- Not designed for persistent web services
- No persistent disk by default
- More complex than traditional hosting
- Better as a compute layer than primary hosting

**Best for:** AI inference, batch processing, GPU workloads (not primary hosting)

---

## Recommendation Matrix

| Use Case | Best Option | Why |
|----------|-------------|-----|
| **V1 Development** | Render (free) | Simplest, already familiar, Git deploys |
| **Production (low traffic)** | Render ($7/mo) or Koyeb (free) | Always-on, affordable |
| **Production (global)** | Fly.io | Global edge, persistent volumes |
| **Self-hosting** | Coolify + Hetzner VPS | Full control, cost-efficient |
| **GPU/AI workloads** | Modal | Serverless GPU, scale-to-zero |
| **Multi-service stack** | Oracle Cloud Free | 4 OCPUs, 24 GB RAM, always-on |
| **Serverless-first** | Koyeb or Cloud Run | Scale-to-zero, pay-per-use |

---

## Recommended Architecture for Forge-Omix

### Phase 1: V1 Development (Now)

**Primary:** Render (free tier)
- Connect GitHub repo
- Auto-deploy on push
- Use LibSQL embedded (no external DB needed)
- Store projects in container filesystem (ephemeral is fine for dev)

**Why:** Simplest setup, already familiar to user, zero cost

### Phase 2: Production Launch

**Option A: Render ($7/mo)**
- Upgrade to paid tier (no spin-down)
- Add persistent disk for project storage
- Custom domain

**Option B: Fly.io (~$2/mo)**
- Always-on VM
- Persistent volumes
- Better performance than Render free tier

**Option C: Koyeb (free)**
- Serverless (scale-to-zero)
- Nairobi region (closest to Kenya)
- Need external storage (S3-compatible) for LibSQL

### Phase 3: Scale

**Option A: Coolify + VPS**
- Self-hosted PaaS
- Multiple projects on one VPS
- Full control

**Option B: Fly.io (multi-region)**
- Global edge deployment
- Multiple services

**Option C: Hybrid**
- Render/Fly.io for web app
- Modal for AI/GPU workloads
- Cloudflare R2 for asset storage

---

## Storage Strategy

Since forge-omix uses LibSQL (embedded SQLite), storage is simple:

| Approach | Pros | Cons |
|----------|------|------|
| **Container filesystem** | Zero config, fast | Ephemeral (lost on redeploy) |
| **Persistent volume** | Survives redeploys | Platform-specific setup |
| **Cloudflare R2** | Cheap, S3-compatible | Requires external service |
| **Modal Volumes** | Already have account | $0.09/GiB/month |

**Recommendation:** Start with container filesystem (dev), migrate to persistent volume (prod), consider R2 for asset storage at scale.

---

## Cost Comparison (Monthly)

| Platform | Free Tier | Paid (Entry) | With Storage |
|----------|-----------|--------------|--------------|
| Render | $0 (750 hrs) | $7 | $7 + storage |
| Fly.io | Trial only | ~$2 | ~$2 + volumes |
| Railway | $1 credit | $5 | $5 + storage |
| Koyeb | $0 (1 service) | $2.69 | $2.69 + external |
| Cloud Run | $0 (2M req) | Usage | + external |
| Oracle Free | $0 (forever) | $0 | $0 |
| Coolify | $0 (self) | $5-10 (VPS) | Included |
| Modal | $30 credits | Usage | $0.09/GiB |

---

## Final Recommendation

### For Forge-Omix V1:

**Start with Render (free tier)** - it's the simplest, you already know it, and it's free. When you need always-on reliability, upgrade to $7/mo or migrate to Fly.io.

### For AI/GPU Features (Future):

**Add Modal as a compute layer** - use it for:
- AI-powered design generation
- Screenshot analysis
- Code generation
- Model inference

This keeps the web app lightweight while offloading heavy compute to Modal's serverless GPU pool.

### For Self-Hosting (Long-term):

**Coolify + Hetzner VPS** - if you want full control and cost efficiency. Run forge-omix + other projects on one VPS for ~$5/month total.
