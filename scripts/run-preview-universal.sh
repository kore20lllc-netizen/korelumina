#!/usr/bin/env bash

set -e

PROJECT_ID="$1"
PROJECT_PATH="$2"
PORT="$3"

echo "▶ Preview: $PROJECT_ID"
echo "▶ Path: $PROJECT_PATH"
echo "▶ Port: $PORT"

cd "$PROJECT_PATH"

# Detect package manager
if [ -f "pnpm-lock.yaml" ]; then
  PM="pnpm"
elif [ -f "yarn.lock" ]; then
  PM="yarn"
else
  PM="npm"
fi

# Install deps
echo "▶ Installing deps ($PM)"

if [ "$PM" = "pnpm" ]; then
  pnpm install
elif [ "$PM" = "yarn" ]; then
  yarn install
else
  npm install --legacy-peer-deps
fi

# Detect framework
if [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
  echo "▶ Vite project"
  npx vite --port "$PORT"

elif grep -q "\"next\"" package.json; then
  echo "▶ Next.js project"
  PORT="$PORT" npm run dev

else
  echo "❌ Unknown framework"
  exit 1
fi
