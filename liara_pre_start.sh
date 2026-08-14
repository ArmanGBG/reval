#!/usr/bin/env bash
set -euo pipefail

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Bootstrapping production admins and curriculum..."
npm run db:bootstrap

echo "Liara pre-start completed successfully."
