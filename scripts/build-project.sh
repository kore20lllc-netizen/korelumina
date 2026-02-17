#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-}"
if [[ -z "$PROJECT_ID" ]]; then
  echo "Missing projectId"
  exit 1
fi

ROOT="$(pwd)/runtime/workspaces/$PROJECT_ID"
LOG="$ROOT/build.log"

mkdir -p "$ROOT"

if [[ ! -f "$ROOT/package.json" ]]; then
  echo "No package.json in workspace: $ROOT" > "$LOG"
  exit 1
fi

{
  echo "=== Build Started ==="
  echo "Root: $ROOT"
  cd "$ROOT"
  npm install
  npm run build
  echo "=== Build Finished with code 0 ==="
} > "$LOG" 2>&1
