#!/usr/bin/env bash

set -euo pipefail

PROJECT_ID=$1
ROOT="$(pwd)/projects/$PROJECT_ID"

if [ ! -d "$ROOT" ]; then
  echo "Project directory not found"
  exit 1
fi

echo "Running Docker-isolated build for $PROJECT_ID"

docker run --rm \
  --cpus="1.0" \
  --memory="1g" \
  --pids-limit=256 \
  -v "$ROOT":/app \
  -w /app \
  node:20-bullseye \
  bash -c "
    npm install --no-audit --no-fund &&
    npm run build
  "

