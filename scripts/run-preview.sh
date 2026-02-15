#!/usr/bin/env bash

# Usage: ./run-preview.sh <projectId> <projectPath> <port>

set -e

PROJECT_ID="$1"
PROJECT_PATH="$2"
PORT="$3"

BASE_DIR="$(pwd)"
RUNTIME_DIR="$BASE_DIR/runtime/previews/$PROJECT_ID"

echo "▶ Preparing runtime for $PROJECT_ID"

# Clean old runtime
rm -rf "$RUNTIME_DIR"
mkdir -p "$RUNTIME_DIR"

# Copy project
cp -R "$PROJECT_PATH"/. "$RUNTIME_DIR"

cd "$RUNTIME_DIR"

echo "▶ Checking for monorepo"

if grep -q '"workspace:' package.json 2>/dev/null; then
  echo "❌ Monorepo/workspace detected. Not supported yet."
  exit 2
fi

echo "▶ Installing deps"
npm install --legacy-peer-deps

echo "▶ Starting dev server on $PORT"

export PORT="$PORT"
export NODE_ENV=development

npm run dev -- --port "$PORT"
