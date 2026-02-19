#!/usr/bin/env bash
set -e

PREVIEWD_PORT=3101

echo "🧹 killing old previewd..."
pkill -f "node scripts/previewd.js" 2>/dev/null || true

echo "🚀 starting previewd on ${PREVIEWD_PORT}..."
node scripts/previewd.js > /tmp/previewd.log 2>&1 &

sleep 1

if lsof -i :${PREVIEWD_PORT} >/dev/null; then
  echo "✅ previewd running on ${PREVIEWD_PORT}"
else
  echo "❌ previewd failed to start"
  exit 1
fi

echo "🚀 starting Next dev..."
node ./node_modules/next/dist/bin/next dev -p 3000
