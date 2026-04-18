#!/bin/sh
set -eu

echo "Installing dependencies if needed..."
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  npm install
fi

echo "Generating Prisma client..."
npm run db:generate

echo "Running database migrations..."
npm run db:migrate

echo "Seeding demo data..."
npm run db:seed

echo "Starting Stackline in development mode..."
npm run dev:host
