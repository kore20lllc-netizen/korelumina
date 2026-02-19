#!/usr/bin/env bash
set -euo pipefail

export KORELUMINA_PREVIEWD_HOST="${KORELUMINA_PREVIEWD_HOST:-127.0.0.1}"
export KORELUMINA_PREVIEWD_PORT="${KORELUMINA_PREVIEWD_PORT:-3101}"

mkdir -p runtime/logs

if lsof -iTCP:${KORELUMINA_PREVIEWD_PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "🧹 killing old previewd..."
  pkill -f preview-daemon || true
fi

echo "🚀 starting previewd on ${KORELUMINA_PREVIEWD_PORT}"

npx tsx runtime/preview-daemon.ts \
  > runtime/logs/previewd.log 2>&1 &

sleep 1

if lsof -iTCP:${KORELUMINA_PREVIEWD_PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✅ previewd running on ${KORELUMINA_PREVIEWD_PORT}"
else
  echo "❌ previewd failed to start"
  echo "Check runtime/logs/previewd.log"
  exit 1
fi
