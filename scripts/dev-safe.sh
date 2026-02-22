#!/usr/bin/env bash
set -euo pipefail

echo "🧹 cleaning ports 3000 and 3101..."

# Kill anything on 3000
if lsof -i :3000 >/dev/null 2>&1; then
  lsof -ti :3000 | xargs kill -9 || true
fi

# Kill anything on 3101
if lsof -i :3101 >/dev/null 2>&1; then
  lsof -ti :3101 | xargs kill -9 || true
fi

# Kill any stray node processes (safe in dev)
pkill -9 node || true

rm -rf .next

echo "🚀 starting previewd on 3101..."
export KORELUMINA_PREVIEWD_HOST=127.0.0.1
export KORELUMINA_PREVIEWD_PORT=3101
npx tsx runtime/preview-daemon.ts >/dev/null 2>&1 &
sleep 1
echo "✅ previewd running on 3101"

echo "🚀 starting Next dev..."
npm run dev
