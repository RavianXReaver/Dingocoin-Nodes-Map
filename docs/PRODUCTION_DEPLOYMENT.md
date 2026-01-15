---
layout: default
title: Production Deployment - AtlasP2P
---

# Production Deployment Guide

## Overview

This project is **production-ready** with the following infrastructure:

### ✅ Existing Production Features

1. **CI/CD Workflows** (`.github/workflows/`)
   - ✅ Automated testing on PRs (lint, typecheck, build)
   - ✅ Docker image builds for web app and crawler
   - ✅ Deployment to production via SSH
   - ✅ Health check after deployment

2. **Docker Infrastructure**
   - ✅ Multi-service docker-compose setup
   - ✅ Development environment (docker-compose.dev.yml)
   - ✅ Production environment (docker-compose.prod.yml)
   - ✅ Smart GeoIP auto-download on crawler startup

3. **Services Included in Docker Compose**
   - ✅ **Web App** (Next.js with API routes) - Port 4000
   - ✅ **Crawler** (Python P2P network scanner)
   - ✅ **PostgreSQL** (Database) - Port 4021
   - ✅ **Supabase Auth** (Authentication service)
   - ✅ **PostgREST** (Auto-generated REST API)
   - ✅ **Kong** (API Gateway) - Port 4020
   - ✅ **Inbucket** (Email testing in development)

## Production Deployment Options

### Option 1: Automated CI/CD (Recommended)

**Complete automated deployment pipeline** with smart infrastructure detection.

**Setup:**

**Quick setup (recommended):**
```bash
make setup-deploy
# Follow printed instructions to configure and commit
```

**Manual setup:**
```bash
# 1. Copy template
cp .github/workflows/deploy.yml.example .github/workflows/deploy.yml

# 2. Edit workflow (change branch name, verify settings)
vim .github/workflows/deploy.yml

# 3. Remove from gitignore
sed -i '/.github\/workflows\/deploy.yml/d' .gitignore

# 4. Commit to your fork
git add .github/workflows/deploy.yml
git commit -m "Add deployment workflow"
```

**Workflow:** `.github/workflows/deploy.yml` (created from `.example`)

**Features:**
- ✅ Auto-detects Caddy mode (container/host/none)
- ✅ Auto-detects secrets source (AWS SSM/GitHub/manual)
- ✅ Supports GHCR or ECR registry (easily switchable)
- ✅ Smart host authentication (uses AWS CLI if available)
- ✅ Database backups before deployment
- ✅ Health checks with automatic rollback
- ✅ Builds and deploys on every push to master

**Registry Options:**
- **GHCR (GitHub Container Registry)** - Free, unlimited public images (default)
- **ECR (AWS Elastic Container Registry)** - Private, AWS-integrated

Configure registry in `config/project.config.yaml`:
```yaml
deployment:
  registry:
    type: ghcr  # or ecr
    public: true  # GHCR only
    region: us-east-1  # ECR only
```

**Setup Guide:** See [Complete CI/CD Documentation](./CICD.md) for:
- Full configuration options
- Secrets management (AWS SSM, GitHub Secrets, manual)
- Registry setup (GHCR vs ECR)
- Troubleshooting and advanced features

3. **Server Setup:**
   ```bash
   # On production server
   mkdir -p /opt/atlasp2p
   cd /opt/atlasp2p

   # Copy docker-compose.yml and docker-compose.prod.yml
   # Create .env file with production credentials

   # Login to GHCR
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

   # Pull and start
   docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Option 2: Manual Docker Deployment

**For testing or when you prefer manual control.**

**Self-hosted with all services (Database included):**
```bash
# On your server
git clone https://github.com/your-org/atlasp2p
cd atlasp2p
cp .env.docker.example .env
nano .env  # Configure all secrets

# Start production with Caddy SSL
make prod-docker

# Or without Caddy (if you have host reverse proxy)
make prod-docker-no-caddy
```

**Cloud mode (Supabase Cloud database):**
```bash
# On your server
git clone https://github.com/your-org/atlasp2p
cd atlasp2p
cp .env.cloud.example .env
nano .env  # Add Supabase credentials

# Start production with Caddy SSL
make prod-cloud

# Or without Caddy
make prod-cloud-no-caddy
```

**Host Caddy Setup (if using -no-caddy):**

If you're using `make prod-docker-no-caddy` or `make prod-cloud-no-caddy`, you must set up host Caddy first:

```bash
# 1. Copy and customize the template
cp docker/Caddyfile.host.example /tmp/myproject.Caddyfile

# 2. Edit with your actual domains/ports (from .env)
nano /tmp/myproject.Caddyfile

# 3. Deploy to server
sudo cp /tmp/myproject.Caddyfile /etc/caddy/sites/myproject.Caddyfile
sudo systemctl reload caddy
```

**This is ONE-TIME infrastructure setup, NOT deployed by CI/CD.**

See `docker/Caddyfile.host.example` for complete instructions and `docs/DEPLOYMENT_SCENARIOS.md` for details.

---

**Note:** Manual deployment requires:
- Docker and Docker Compose installed
- All secrets configured in .env
- DNS pointing to server (for SSL)
- Manual updates on every code change
- Host Caddy configured (if using -no-caddy targets)

For automated deployments with CI/CD, see Option 1 above.

## Docker Services Breakdown

### Core Services (Always Running)

1. **PostgreSQL** (`atlasp2p-db`)
   - Database for nodes, snapshots, profiles
   - Port: 4021 (development), internal in production
   - Volume: `postgres-data` (persistent)

2. **Supabase Auth** (`atlasp2p-auth`)
   - User authentication and JWT management
   - Integrated with PostgreSQL

3. **PostgREST** (`atlasp2p-rest`)
   - Auto-generated REST API from PostgreSQL schema
   - Row Level Security (RLS) enforcement

4. **Kong** (`atlasp2p-kong`)
   - API Gateway for routing and rate limiting
   - Port: 4020 (exposed to host)

### Application Services

5. **Web App** (`atlasp2p-web`)
   - Next.js 16 with App Router
   - API routes for verification, profiles, tipping
   - Port: 4000 (development), 443 with Caddy (production)
   - Dockerfile: `Dockerfile.web`

6. **Crawler** (`atlasp2p-crawler`)
   - Python P2P network scanner
   - Auto-downloads GeoIP databases on startup
   - Runs every 1-5 minutes (configurable)
   - Dockerfile: `Dockerfile.crawler`
   - Volume: `geoip-data` (persistent)

### Development Only

7. **Inbucket** (`atlasp2p-inbucket`)
   - Email testing (not needed in production)
   - Port: 4023 (web UI)

8. **Supabase Studio** (`atlasp2p-studio`)
   - Database admin UI (optional in production)
   - Port: 4022

## Environment Configuration

Production deployments require ~40+ environment variables covering database, authentication, email, and optional services. These can be managed via **AWS SSM**, **GitHub Secrets**, or **manual .env files**.

See [CI/CD Secrets Management](./CICD.md#-secrets-management) for detailed setup instructions for each method.

### Required Environment Variables

AtlasP2P requires the following environment variables for production deployment:

#### Core Configuration (Required)

```bash
# Docker Compose
COMPOSE_PROJECT_NAME=atlasp2p           # Container naming prefix

# Node Environment
NODE_ENV=production                     # Always 'production' in prod

# Domain & SSL (Required for Caddy SSL)
DOMAIN=nodes.example.com                # Your production domain
ACME_EMAIL=admin@example.com            # Email for Let's Encrypt SSL

# Port Configuration (Optional - defaults to 4000)
PORT=4000                               # Web app port
WEB_PORT=4000                           # Web app external port
```

#### Supabase Configuration (Required)

```bash
# Supabase URLs
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co  # Cloud Supabase
# OR
NEXT_PUBLIC_SUPABASE_URL=http://localhost:4020             # Self-hosted

# Supabase Keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Internal URLs (Self-hosted only)
SUPABASE_URL=http://kong:8000           # Crawler → Supabase
SUPABASE_INTERNAL_URL=http://kong:8000  # Next.js → Supabase (server-side)
API_EXTERNAL_URL=http://localhost:4020  # Public API URL
```

#### Database (Self-hosted mode only)

```bash
# PostgreSQL Configuration
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=postgres

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# Cron Secret (generate: openssl rand -hex 32)
CRON_SECRET=your-super-secret-cron-token-change-in-production-min-32-chars
```

#### Authentication (GoTrue - Self-hosted only)

```bash
# Auth URLs
GOTRUE_SITE_URL=http://localhost:4000           # Web app URL
GOTRUE_URI_ALLOW_LIST=http://localhost:4000     # Allowed redirect URLs

# Email Configuration (SMTP for auth emails)
SMTP_HOST=smtp.resend.com                       # SMTP server
SMTP_PORT=587                                   # SMTP port
SMTP_USER=resend                                # SMTP username
SMTP_PASS=re_xxxxx                              # SMTP password (Resend API key)
SMTP_ADMIN_EMAIL=admin@example.com              # From address
SMTP_SENDER_NAME=AtlasP2P                       # From name

# Email Testing (Dev only)
GOTRUE_MAILER_AUTOCONFIRM=false                 # Auto-confirm emails (dev: true)
```

#### Email Service (Application emails)

**Choose ONE provider** (configured in `project.config.yaml`):

```bash
# Option 1: Resend (Recommended - https://resend.com)
RESEND_API_KEY=re_xxxxx

# Option 2: SendGrid (Alternative - https://sendgrid.com)
SENDGRID_API_KEY=SG.xxxxx

# Option 3: Custom SMTP (if using 'smtp' provider)
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_TLS=true
```

**Note:** GoTrue auth emails (signup/password reset) use `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS` above. Application custom emails use the provider configured in `project.config.yaml`.

#### Security (Optional but recommended)

```bash
# Cloudflare Turnstile (Bot protection)
# Get keys at: https://dash.cloudflare.com/turnstile
TURNSTILE_SECRET_KEY=0x4AAAAAACHmrfqdjuWH8nhgwEVTDHAqZTE

# Admin Users (Comma-separated emails)
ADMIN_EMAILS=admin@example.com,owner@example.com
```

#### GeoIP (Optional - MaxMind GeoLite2)

```bash
# MaxMind credentials (free account at maxmind.com)
MAXMIND_ACCOUNT_ID=123456
MAXMIND_LICENSE_KEY=xxxxxx

# GeoIP database path (defaults to /app/data/geoip)
GEOIP_DB_PATH=/app/data/geoip
```

#### Crawler Configuration (Optional - has defaults)

```bash
# Crawler behavior
CRAWLER_INTERVAL_MINUTES=5              # Crawl every 5 minutes
MAX_CONCURRENT_CONNECTIONS=100          # Max parallel connections
CONNECTION_TIMEOUT_SECONDS=10           # Connection timeout

# Optional: RPC connection to local node
# RPC_HOST=host.docker.internal         # Use 172.17.0.1 on Linux
# RPC_PORT=8332
# RPC_USER=rpcuser
# RPC_PASS=rpcpassword
```

#### Docker Registry (Auto-injected by CI/CD)

These variables are **automatically injected** by the deployment workflow. You don't set these manually - they're shown for reference:

```bash
# GitHub Container Registry (GHCR)
REGISTRY_TYPE=ghcr
REGISTRY_PUBLIC=true
REGISTRY=ghcr.io/your-org
IMAGE_PREFIX=atlasp2p-
IMAGE_TAG=latest

# OR AWS Elastic Container Registry (ECR)
REGISTRY_TYPE=ecr
REGISTRY_PUBLIC=false
REGISTRY_REGION=us-east-1
REGISTRY=123456789.dkr.ecr.us-east-1.amazonaws.com
IMAGE_PREFIX=atlasp2p/
IMAGE_TAG=latest
```

See [CI/CD Registry Configuration](./CICD.md#-docker-registry-configuration) for details.

### Secrets Management Decision Tree

Choose the best secrets management method for your deployment:

```
Do you have AWS infrastructure?
├─ Yes → Use AWS SSM
│         ✓ Centralized management
│         ✓ Encrypted at rest
│         ✓ Audit logging
│         → See: scripts/setup-ssm.sh
│
└─ No → Are you a solo developer?
         ├─ Yes → Use GitHub Secrets
         │         ✓ Simple setup
         │         ✓ No external dependencies
         │         → See: scripts/setup-github-secrets.sh
         │
         └─ No (team without AWS) → GitHub Secrets or Manual
                   ✓ GitHub: Centralized in repo
                   ✓ Manual: Full control
                   → See: docs/CICD.md#secrets-management
```

**Quick start:**
- **Teams with AWS:** Run `./scripts/setup-ssm.sh`
- **Solo developers:** Run `./scripts/setup-github-secrets.sh`
- **Testing/dev:** Create `.env` manually on server

### Security Best Practices

1. **SecureString encryption** (AWS SSM):
   - Always use `--type SecureString` for sensitive parameters
   - Encrypt with AWS KMS for additional security
   - Enable CloudTrail for audit logging

2. **IAM permissions** (AWS SSM):
   - Use least-privilege access (only `ssm:GetParameter`)
   - Restrict to specific parameter paths
   - Rotate access keys regularly

3. **Secret rotation**:
   - Rotate database passwords quarterly
   - Rotate JWT secrets annually
   - Update service role keys after team changes
   - Use new SMTP credentials for each environment

4. **GitHub Secrets**:
   - Never commit secrets to git
   - Use environment protection rules
   - Require reviewers for production deployments
   - Audit secret access logs

5. **Server security** (Manual .env):
   - Set file permissions: `chmod 600 .env`
   - Restrict SSH access
   - Use firewall rules (UFW/iptables)
   - Keep server updated

### Template Files

Use these template files as references:

- **Self-hosted Docker:** `.env.docker.example` (40 variables)
- **Cloud Supabase:** `.env.cloud.example` (25 variables)
- **Development:** `.env.example` (minimal required)

### Helper Scripts

AtlasP2P provides helper scripts for secrets management:

| Script | Purpose | Location |
|--------|---------|----------|
| `setup-ssm.sh` | Interactive AWS SSM setup | `scripts/setup-ssm.sh` |
| `setup-github-secrets.sh` | Generate GitHub Secrets from .env | `scripts/setup-github-secrets.sh` |

**Note:** These scripts are coming soon. For now, follow the manual setup instructions in [CI/CD Guide](./CICD.md#-secrets-management).

## Deployment Mode Decision

### Self-Hosted vs Cloud Supabase

| Factor | Self-Hosted Docker | Cloud Supabase |
|--------|-------------------|----------------|
| **Best for** | Small networks (<1K nodes) | Medium-large networks |
| **Complexity** | Low (one docker-compose) | Medium (external service) |
| **Cost** | $12-24/month (VPS only) | $25-50/month (VPS + Supabase Pro) |
| **Avatar Storage** | Docker volume (local files) | Supabase Storage (CDN) |
| **Scalability** | Limited to server | Auto-scaling |
| **Backups** | Manual | Automated (Supabase) |
| **CDN** | None (slower globally) | Built-in (faster) |

**Recommendation:**
- 🏢 **Self-Hosted**: Test deployments, small communities, cost-sensitive
- ☁️ **Cloud Supabase**: Production, global audience, high traffic

### Avatar Storage Setup

See **[SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md)** for complete guide on:
- Self-hosted Docker volumes (automatic)
- Cloud Supabase Storage bucket creation
- RLS policies configuration
- Migration between modes

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] **Choose deployment mode** (self-hosted vs cloud Supabase)
- [ ] Review `BEST_PRACTICES_REVIEW.md` for crawler improvements
- [ ] Review `CRAWLER_IMPROVEMENTS.md` for retry logic and protocol negotiation
- [ ] **If using Cloud Supabase:**
  - [ ] Create Supabase project
  - [ ] Run migrations: `supabase db push`
  - [ ] Configure RLS policies
  - [ ] **Set up Supabase Storage** (see SUPABASE_STORAGE_SETUP.md)
- [ ] Set up MaxMind account for GeoIP (free tier available)
- [ ] Configure GitHub secrets or AWS credentials
- [ ] Set up production server (VPS, EC2, etc.)

### Build Verification

```bash
# Verify TypeScript compilation
pnpm typecheck

# Verify linting
pnpm lint

# Verify production build
pnpm build

# Verify Docker builds
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### Deployment

1. **Push to main branch** (triggers automated deployment)
2. **Monitor GitHub Actions** for build success
3. **Verify health check** passes
4. **Check logs** on production server:
   ```bash
   docker logs atlasp2p-web
   docker logs atlasp2p-crawler
   ```

### Post-Deployment

- [ ] Verify web app accessible: `https://your-domain.com`
- [ ] Check API health: `curl https://your-domain.com/api/stats`
- [ ] Verify crawler is running: `docker logs atlasp2p-crawler | grep "CRAWL ITERATION"`
- [ ] Check GeoIP auto-download: `docker logs atlasp2p-crawler | grep "GeoIP"`
- [ ] Monitor database: `SELECT COUNT(*) FROM nodes;`
- [ ] Set up monitoring (Sentry, CloudWatch, etc.)

## Fork Customization

When forking for a new chain:

1. **Update chain config:**
   - `config/project.config.yaml` - All chain configuration (crawler reads this automatically)

2. **Update branding:**
   - `config/project.config.yaml` - Colors, logos, and styling
   - Restart containers: `docker restart atlasp2p-web atlasp2p-crawler`

3. **CI/CD Configuration:**
   - Configure deployment in `config/project.config.yaml`
   - See [CI/CD Guide](./CICD.md) for registry and secrets setup

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Customize for YourChain"
   git push origin main
   # GitHub Actions will automatically build and deploy
   ```

## Scaling Considerations

### Small Network (<1000 nodes)
- Single VPS (2 CPU, 4GB RAM)
- All services in docker-compose
- Database on same server

### Medium Network (1000-10000 nodes)
- Separate database server (PostgreSQL RDS/managed)
- Multiple crawler instances (horizontal scaling)
- CDN for static assets

### Large Network (>10000 nodes)
- Managed database (AWS RDS, Supabase)
- Kubernetes for auto-scaling
- Separate crawler cluster
- Redis for caching
- Load balancer

## Monitoring

### Essential Metrics

1. **Crawler Health:**
   - Nodes discovered per crawl
   - Success rate (nodes with version data)
   - Crawl duration
   - GeoIP database age

2. **Web App:**
   - Response times (p50, p95, p99)
   - Error rates (4xx, 5xx)
   - Active users
   - Database query performance

3. **Database:**
   - Connection pool usage
   - Query latency
   - Table sizes
   - Index usage

### Logging

```bash
# Web app logs
docker logs -f atlasp2p-web

# Crawler logs (with filters)
docker logs -f atlasp2p-crawler | grep -E "CRAWL|ERROR|Retry|Fallback"

# Database logs
docker logs -f atlasp2p-db

# API Gateway logs
docker logs -f atlasp2p-kong
```

## Troubleshooting

### Crawler not finding nodes

```bash
# Check DNS seeds resolve
docker exec atlasp2p-crawler dig seed1.yourchain.org

# Check protocol version matches chain
docker exec atlasp2p-crawler cat /app/config/project.config.yaml | grep protocolVersion
```

### GeoIP not loading

```bash
# Check if databases exist
docker exec atlasp2p-crawler ls -lh /app/data/geoip/

# Check credentials
docker exec atlasp2p-crawler env | grep MAXMIND

# Force re-download
docker exec atlasp2p-crawler rm -rf /app/data/geoip/*.mmdb
docker restart atlasp2p-crawler
```

### Web app not connecting to database

```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your-anon-key"

# Check environment variables
docker exec atlasp2p-web env | grep SUPABASE
```

## Backup Strategy

### Database

```bash
# Manual backup
docker exec atlasp2p-db pg_dump -U supabase_admin postgres > backup.sql

# Automated (add to crontab)
0 2 * * * docker exec atlasp2p-db pg_dump -U supabase_admin postgres | gzip > /backups/nodes-$(date +\%Y\%m\%d).sql.gz
```

### GeoIP Databases

- Automatically re-downloaded if >7 days old
- Stored in Docker volume `geoip-data`
- Backup not critical (can re-download)

## Security Hardening

1. **Firewall Rules:**
   ```bash
   # Allow only necessary ports
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 22/tcp  # SSH (restrict to known IPs)
   ufw enable
   ```

2. **Database:**
   - Use strong `supabase_admin` password
   - Enable SSL connections
   - Regular security updates: `docker compose pull`

3. **Secrets Management:**
   - Never commit `.env` files
   - Use GitHub Secrets or AWS Parameter Store
   - Rotate service role keys regularly

4. **Rate Limiting:**
   - Kong API Gateway has built-in rate limiting
   - Adjust in `docker/kong.yml`

## Cost Estimates

### AWS Deployment (Example)

- **ECS Fargate** (web + crawler): $30-50/month
- **RDS PostgreSQL** (db.t3.small): $25/month
- **ECR Storage**: $1-5/month
- **Data Transfer**: $5-20/month
- **Total**: ~$60-100/month

### VPS Deployment (DigitalOcean, Linode)

- **2 CPU, 4GB RAM, 80GB SSD**: $12-24/month
- **All-in-one docker-compose**: Most cost-effective

### Supabase (Database + Auth)

- **Free tier**: Up to 500MB database, 2GB bandwidth
- **Pro tier**: $25/month, 8GB database
- Recommended for production

---

**Ready to Deploy?** Follow the checklist above and run:

```bash
# Final verification
make build
make typecheck
make lint

# Push to trigger deployment
git push origin main
```

GitHub Actions will handle the rest! 🚀
