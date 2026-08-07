#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "🔨 Building Next.js..."
npx next build

echo "📂 Copying static assets to standalone..."
cp -rn .next/static .next/standalone/.next/
cp -rn public/* .next/standalone/public/ 2>/dev/null || true

echo "🚀 Starting server on port 3000..."
exec node .next/standalone/server.js
