#!/bin/bash

set -e

echo "=========================================="
echo "🚀 TaxGrok Startup Script"
echo "=========================================="

# Function to log with timestamp
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle errors
handle_error() {
  log "❌ ERROR: $1"
  exit 1
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  handle_error "DATABASE_URL environment variable is not set"
fi

log "✅ DATABASE_URL is configured"

# Wait for database to be ready (with retry logic)
log "🔍 Checking database connectivity..."
MAX_RETRIES=30
RETRY_COUNT=0
DATABASE_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if npx prisma db push --skip-generate --accept-data-loss 2>&1 | grep -q "datasource\|Everything is now in sync"; then
    DATABASE_READY=true
    log "✅ Database is ready"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  log "⏳ Waiting for database... (Attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ "$DATABASE_READY" = false ]; then
  handle_error "Database is not accessible after $MAX_RETRIES attempts"
fi

# Generate Prisma Client
log "📦 Generating Prisma Client..."
npx prisma generate || handle_error "Failed to generate Prisma Client"
log "✅ Prisma Client generated successfully"

# Run database migrations
log "🔄 Running database migrations..."
npx prisma migrate deploy || handle_error "Failed to run database migrations"
log "✅ Database migrations completed successfully"

# Create uploads directory if it doesn't exist
log "📁 Setting up uploads directory..."
mkdir -p /app/uploads || mkdir -p ./uploads
if [ -d "/app/uploads" ]; then
  chmod 755 /app/uploads
  log "✅ Uploads directory created at /app/uploads"
elif [ -d "./uploads" ]; then
  chmod 755 ./uploads
  log "✅ Uploads directory created at ./uploads"
else
  log "⚠️  Warning: Could not create uploads directory"
fi

# Log environment info
log "📊 Environment Info:"
log "   - Node version: $(node --version)"
log "   - NPM version: $(npm --version)"
log "   - Working directory: $(pwd)"

echo "=========================================="
log "🎉 Startup tasks completed successfully!"
log "🚀 Starting Next.js application..."
echo "=========================================="

# Start the Next.js application
exec npm start
