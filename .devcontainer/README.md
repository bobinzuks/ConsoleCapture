# ConsoleCapture Devcontainer Configuration

This directory contains the development container configuration for GitHub Codespaces and local VS Code devcontainer development.

## Quick Start

### Option 1: GitHub Codespaces (Recommended)

1. Click the "Code" button on GitHub
2. Select "Codespaces" tab
3. Click "Create codespace on main"
4. Wait for the environment to build (~5-10 minutes first time)
5. Start coding! All services are pre-configured and running

### Option 2: Local VS Code + Docker

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Install [VS Code](https://code.visualstudio.com/)
3. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
4. Open this repository in VS Code
5. Press `F1` → "Dev Containers: Reopen in Container"
6. Wait for the container to build and start

## Required Secrets (Codespaces)

The following secrets should be configured in your GitHub repository settings under **Settings → Secrets and variables → Codespaces**:

### Required for Development
These secrets have default values but should be changed for security:

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-this
SESSION_SECRET=your-session-secret-change-this
MEILISEARCH_API_KEY=masterKey
```

### Optional (For Testing Integrations)
Only needed if you want to test specific integrations:

```bash
# Stripe (Payment Testing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google OAuth (Authentication Testing)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...

# AWS S3 (Production Storage Testing - use MinIO for dev)
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

### How to Generate Secrets

```bash
# Generate a secure JWT secret
openssl rand -base64 32

# Generate a session secret
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Services Included

The devcontainer automatically starts these services via Docker Compose:

| Service | Port | Description |
|---------|------|-------------|
| **Backend API** | 3000 | Express.js REST API |
| **MCP Cloud** | 4000 | Model Context Protocol server |
| **PostgreSQL** | 5432 | Primary database with TimescaleDB |
| **Redis** | 6379 | Cache, sessions, rate limiting |
| **Elasticsearch** | 9200 | Full-text search engine |
| **MeiliSearch** | 7700 | Alternative search engine |
| **MinIO** | 9000 | S3-compatible object storage |
| **MinIO Console** | 9001 | Web UI for MinIO |

## Pre-installed VS Code Extensions

The devcontainer comes with these extensions pre-installed:

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Docker** - Docker management
- **GitLens** - Git visualization
- **Thunder Client** - API testing
- **SQLTools** - Database management
- **Error Lens** - Inline error highlighting
- **Todo Tree** - TODO comment tracking

## Environment Variables

All environment variables are pre-configured for development. The main ones:

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@postgres:5432/console_capture
REDIS_URL=redis://redis:6379
ELASTICSEARCH_NODE=http://elasticsearch:9200
S3_ENDPOINT=http://minio:9000
```

See `.devcontainer/devcontainer.json` for the complete list.

## Post-Create Setup

When the devcontainer is created, it automatically:

1. ✅ Installs all npm dependencies
2. ✅ Waits for all services to be healthy
3. ✅ Runs database migrations
4. ✅ Seeds the database with test data
5. ✅ Displays a welcome message with service URLs

This is handled by `.devcontainer/setup.sh`.

## Customization

### For Backend-Only Development

If you only need the backend services, create `.devcontainer/backend/devcontainer.json`:

```json
{
  "name": "ConsoleCapture - Backend Only",
  "dockerComposeFile": "../../docker-compose.yml",
  "service": "backend",
  "workspaceFolder": "/workspace/packages/backend",
  "forwardPorts": [3000, 5432, 6379, 9200]
}
```

### For Extension Development

Chrome extension development doesn't need backend services running constantly.

## Troubleshooting

### Services Not Starting

```bash
# Check service status
docker ps

# View service logs
docker logs console-capture-postgres
docker logs console-capture-redis
docker logs console-capture-elasticsearch

# Restart all services
docker-compose down && docker-compose up -d
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker exec -it console-capture-postgres psql -U postgres -d console_capture

# Re-run migrations
npm run db:migrate

# Reset database (WARNING: Deletes all data)
npm run db:reset
```

### Port Conflicts

If ports are already in use on your machine:

1. Stop conflicting services
2. Or modify `docker-compose.yml` to use different ports

### Rebuild Container

If something is broken, rebuild the devcontainer:

1. Press `F1`
2. Select "Dev Containers: Rebuild Container"
3. Wait for rebuild to complete

## Performance Tips

### For Faster Startups

1. **Enable Codespaces Prebuilds**
   - Go to repository settings
   - Enable prebuilds for main branch
   - Reduces startup time from 10 min → 1 min

2. **Use Smaller Machine Type**
   - Default: 4-core, 8GB RAM
   - For simple tasks: 2-core, 4GB RAM is sufficient

3. **Stop Unused Services**
   - If not using Elasticsearch: comment out in docker-compose.yml
   - Saves memory and startup time

## Additional Resources

- [VS Code Devcontainer Docs](https://code.visualstudio.com/docs/devcontainers/containers)
- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## Support

For issues with the devcontainer configuration:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review container logs: `docker-compose logs`
3. Open an issue on GitHub with the `devcontainer` label

---

Happy coding! 🚀
