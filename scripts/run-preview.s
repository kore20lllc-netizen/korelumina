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

echo "▶ Installing deps"
npm install --silent

echo "▶ Starting dev server on $PORT"

export PORT="$PORT"
export NODE_ENV=development

npm run dev -- --port "$PORT"
