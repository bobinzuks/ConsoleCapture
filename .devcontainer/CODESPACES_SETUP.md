# GitHub Codespaces Setup Guide

## Quick Start

Your ConsoleCapture repository is now configured for GitHub Codespaces! 🎉

### Repository URL
**https://github.com/bobinzuks/ConsoleCapture**

## Step 1: Configure Codespaces Secrets

Before launching a Codespace, configure the required secrets:

### Via GitHub Web UI

1. Go to: **https://github.com/bobinzuks/ConsoleCapture/settings/secrets/codespaces**
2. Click **"New repository secret"**
3. Add each secret below:

#### Required Secrets (Development)

```bash
Name: JWT_SECRET
Value: [Generate with: openssl rand -base64 32]

Name: JWT_REFRESH_SECRET
Value: [Generate with: openssl rand -base64 32]

Name: SESSION_SECRET
Value: [Generate with: openssl rand -hex 32]

Name: MEILISEARCH_API_KEY
Value: masterKey
```

#### Optional Secrets (For Testing Integrations)

```bash
Name: STRIPE_SECRET_KEY
Value: sk_test_... (your Stripe test key)

Name: STRIPE_PUBLISHABLE_KEY
Value: pk_test_... (your Stripe publishable key)

Name: GOOGLE_CLIENT_ID
Value: ....apps.googleusercontent.com

Name: GOOGLE_CLIENT_SECRET
Value: ... (your Google OAuth secret)
```

### Via GitHub CLI

Run these commands to generate and set secrets automatically:

```bash
# Generate and set JWT secrets
gh secret set JWT_SECRET --body "$(openssl rand -base64 32)" --repo bobinzuks/ConsoleCapture --env codespaces

gh secret set JWT_REFRESH_SECRET --body "$(openssl rand -base64 32)" --repo bobinzuks/ConsoleCapture --env codespaces

gh secret set SESSION_SECRET --body "$(openssl rand -hex 32)" --repo bobinzuks/ConsoleCapture --env codespaces

# Set MeiliSearch API key
gh secret set MEILISEARCH_API_KEY --body "masterKey" --repo bobinzuks/ConsoleCapture --env codespaces
```

## Step 2: Launch Your Codespace

### Option A: Via GitHub Web UI

1. Go to: **https://github.com/bobinzuks/ConsoleCapture**
2. Click the green **"<> Code"** button
3. Select the **"Codespaces"** tab
4. Click **"Create codespace on main"**
5. Wait 5-10 minutes for initial build

### Option B: Via GitHub CLI

```bash
gh codespace create --repo bobinzuks/ConsoleCapture --branch main
```

## Step 3: What Happens Automatically

When your Codespace starts, it will automatically:

1. ✅ **Install dependencies** - `npm install` across all packages
2. ✅ **Start Docker services** - PostgreSQL, Redis, Elasticsearch, MinIO, MeiliSearch
3. ✅ **Run database migrations** - Set up initial schema with TimescaleDB
4. ✅ **Seed test data** - Populate database with sample users and recordings
5. ✅ **Display welcome message** - Show service URLs and quick commands

**Total setup time**: ~5-10 minutes (first time), ~1-2 minutes (with prebuilds)

## Step 4: Verify Services

Once your Codespace is ready, verify all services are running:

```bash
# Check Docker services
docker ps

# Expected output: 6 containers (postgres, redis, elasticsearch, meilisearch, minio, backend)

# Test database connection
npm run db:migrate

# Test Redis connection
docker exec console-capture-redis redis-cli ping
# Expected: PONG

# Test health endpoint
curl http://localhost:3000/api/health
```

## Step 5: Start Development

### Available Commands

```bash
# Start all services in development mode
npm run dev

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build all packages
npm run build

# Type check
npm run typecheck
```

### Access Services

Once running, access these URLs (they auto-forward in Codespaces):

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000 | REST API server |
| **API Health** | http://localhost:3000/api/health | Health check endpoint |
| **MCP Cloud** | http://localhost:4000 | MCP HTTP/SSE server |
| **MinIO Console** | http://localhost:9001 | S3-compatible storage UI |
| **Elasticsearch** | http://localhost:9200 | Search engine |
| **MeiliSearch** | http://localhost:7700 | Alternative search UI |

## Step 6: Enable Codespaces Prebuilds (Recommended)

Speed up Codespace startup from 10 minutes → 1 minute:

1. Go to: **https://github.com/bobinzuks/ConsoleCapture/settings/codespaces**
2. Click **"Set up prebuild"**
3. Select **"main"** branch
4. Choose region (closest to you)
5. Click **"Create"**

Prebuilds will now run automatically on every push to `main`.

## Troubleshooting

### Services Not Starting

```bash
# View all container logs
docker-compose logs

# View specific service logs
docker logs console-capture-postgres
docker logs console-capture-redis

# Restart all services
docker-compose down && docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL is ready
docker exec console-capture-postgres pg_isready -U postgres

# Connect to database
docker exec -it console-capture-postgres psql -U postgres -d console_capture

# Re-run migrations
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

### Port Already in Use

If you see "port already in use" errors:

```bash
# Stop all Docker containers
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Restart services
docker-compose up -d
```

### Environment Variables Not Loading

```bash
# Check if secrets are set
gh secret list --repo bobinzuks/ConsoleCapture --env codespaces

# Rebuild container to reload secrets
# In VS Code: F1 → "Codespaces: Rebuild Container"
```

## Advanced Configuration

### Using a Different Branch

```bash
# Create Codespace on develop branch
gh codespace create --repo bobinzuks/ConsoleCapture --branch develop
```

### Customizing Machine Type

Default: 4-core, 8GB RAM

To use a larger machine:
1. Click **"<> Code"** → **"Codespaces"**
2. Click **"..."** → **"New with options"**
3. Select machine type (up to 32-core, 64GB RAM)

### Multiple Devcontainer Configs

If you want backend-only or extension-only development:

```bash
# Backend-only (in .devcontainer/backend/devcontainer.json)
{
  "name": "Backend Only",
  "workspaceFolder": "/workspace/packages/backend",
  "forwardPorts": [3000, 5432, 6379, 9200]
}
```

## Next Steps

### Testing Strategy

Now that Codespaces is set up, implement test suites:

```bash
# Create first test file
touch packages/backend/src/services/__tests__/auth.test.ts

# Run tests
npm run test

# View coverage
npm run test:coverage
```

See `.devcontainer/TESTING_STRATEGY.md` for the complete testing roadmap.

### Deployment

After tests are implemented:

1. Merge to `main` branch
2. GitHub Actions CI/CD will run automatically
3. Deploy to staging (automatic)
4. Deploy to production (manual approval)

## Resources

- [Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Devcontainer Reference](https://containers.dev/)
- [ConsoleCapture Docs](../docs/)
- [Contributing Guide](../CONTRIBUTING.md)

## Support

For Codespaces issues:
- Check [Troubleshooting](#troubleshooting) above
- Open an issue: https://github.com/bobinzuks/ConsoleCapture/issues
- Tag with `codespaces` label

---

**Happy coding in the cloud!** ☁️🚀
