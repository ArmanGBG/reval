#!/bin/sh
set -eu

echo "Running Prisma migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Bootstrapping production admins and curriculum..."
node node_modules/tsx/dist/cli.mjs prisma/bootstrap-production.ts

echo "Liara pre-start completed successfully."
