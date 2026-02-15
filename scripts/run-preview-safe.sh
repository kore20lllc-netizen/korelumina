#!/usr/bin/env bash
# Safe preview runner for Korelumina

set -e

PROJECT_ID="$1"
PROJECT_PATH="$2"
PORT="$3"

if [ -z "$PROJECT_ID" ] || [ -z "$PROJECT_PATH" ] || [ -z "$PORT" ]; then
  echo "Usage: run-preview-safe.sh <id> <path> <port>"
  exit 1
fi

echo "▶ Preview: $PROJECT_ID"
echo "▶ Path: $PROJECT_PATH"
echo "▶ Port: $PORT"

cd "$PROJECT_PATH" || exit 1

# Detect monorepo / workspace
if [ -f "pnpm-workspace.yaml" ] || \
   [ -f "lerna.json" ] || \
   grep -q "\"workspaces\"" package.json 2>/dev/null; then
  echo "❌ Monorepo detected. Skipping."
  exit 2
fi

# Clean cache
rm -rf .next node_modules/.cache

# Install deps safely
echo "▶ Installing deps (safe)..."

npm install \
  --legacy-peer-deps \
  --no-fund \
  --no-audit \
  --silent

# Disable turbo
export NEXT_DISABLE_TURBO=1
export TURBO_DISABLED=1

# Runtime vars
export NODE_ENV=development
export PORT="$PORT"

# Run
echo "▶ Launching preview..."

exec npm run dev -- --port "$PORT"
