#!/bin/bash
set -e

echo "Starting Railway migration..."

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "Generating Prisma Client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Creating uploads directory..."
mkdir -p /app/uploads
chmod 755 /app/uploads

echo "Migration completed successfully!"
