#!/bin/bash
set -e

echo "🔧 Setting up ConsoleCapture development environment..."

# Wait for services to be ready
echo "⏳ Waiting for PostgreSQL..."
until docker exec console-capture-postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

echo "⏳ Waiting for Redis..."
until docker exec console-capture-redis redis-cli ping > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Redis is ready"

echo "⏳ Waiting for Elasticsearch..."
until curl -s http://elasticsearch:9200/_cluster/health > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Elasticsearch is ready"

echo "⏳ Waiting for MinIO..."
until curl -s http://minio:9000/minio/health/live > /dev/null 2>&1; do
  sleep 1
done
echo "✅ MinIO is ready"

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate

# Seed database with test data
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ConsoleCapture development environment is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Available Services:"
echo "  • Backend API:        http://localhost:3000"
echo "  • MCP Cloud Server:   http://localhost:4000"
echo "  • PostgreSQL:         localhost:5432"
echo "  • Redis:              localhost:6379"
echo "  • Elasticsearch:      http://localhost:9200"
echo "  • MeiliSearch:        http://localhost:7700"
echo "  • MinIO Console:      http://localhost:9001"
echo ""
echo "🚀 Quick Start Commands:"
echo "  npm run dev          - Start all services in development mode"
echo "  npm run test         - Run test suites"
echo "  npm run lint         - Lint all packages"
echo "  npm run build        - Build all packages"
echo ""
echo "📚 Documentation:"
echo "  • README.md          - Project overview"
echo "  • CONTRIBUTING.md    - Contribution guidelines"
echo "  • docs/              - Detailed documentation"
echo ""
