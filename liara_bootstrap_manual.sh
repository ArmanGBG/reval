#!/bin/sh
set -eu

echo "Applying Prisma migrations..."
node liara-migrate.cjs

echo "Creating production admins and initial curriculum..."
node bootstrap-production.cjs

echo "Syncing book curriculum from CSV files..."
node sync-curriculum.cjs --apply

echo "Database bootstrap completed successfully."
