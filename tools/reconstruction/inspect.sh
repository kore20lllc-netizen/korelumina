#!/usr/bin/env bash

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

usage() {
  cat <<'USAGE'
Usage:

  tools/reconstruction/inspect.sh architecture
  tools/reconstruction/inspect.sh runtime
  tools/reconstruction/inspect.sh workspace <name>
  tools/reconstruction/inspect.sh imports <path>
  tools/reconstruction/inspect.sh placeholders <path>
  tools/reconstruction/inspect.sh duplicates <path>
  tools/reconstruction/inspect.sh status
USAGE
}

require_argument() {
  local value="${1:-}"

  if [[ -z "$value" ]]; then
    usage
    exit 2
  fi
}

inspect_architecture() {
  echo "===== ARCHITECTURE DOCUMENTS ====="

  find docs/architecture \
    -type f \
    -name "*.md" \
    -print \
  | sort

  echo
  echo "===== GOVERNANCE DOCUMENTS ====="

  find docs/governance \
    -type f \
    -name "*.md" \
    -print \
    2>/dev/null \
  | sort
}

inspect_runtime() {
  echo "===== RUNTIME SOURCE ====="

  find apps/lumina-runtime/src \
    -type f \
    -print \
  | sort

  echo
  echo "===== RUNTIME ROUTES ====="

  grep -R -n \
    "/api/runtime/" \
    apps/lumina-runtime/src \
    --exclude-dir=dist \
    --exclude-dir=node_modules \
    || true

  echo
  echo "===== RUNTIME EVENTS ====="

  grep -R -nE \
    "publishRuntimeEvent|subscribeRuntimeEvents|text/event-stream" \
    apps/lumina-runtime/src \
    --exclude-dir=dist \
    --exclude-dir=node_modules \
    || true
}

inspect_workspace() {
  local name="$1"
  local path="apps/lumina-builder/src/components/workspaces/$name"

  if [[ ! -d "$path" ]]; then
    echo "Workspace not found: $path" >&2
    exit 1
  fi

  echo "===== WORKSPACE FILES ====="

  find "$path" \
    -type f \
    -print \
  | sort

  echo
  echo "===== LUMINA IMPORTS ====="

  grep -R -n \
    "@/components/lumina" \
    "$path" \
    || true

  echo
  echo "===== DIRECT UI IMPORTS ====="

  grep -R -n \
    "@/components/ui/" \
    "$path" \
    || true

  echo
  echo "===== PLACEHOLDER SIGNALS ====="

  grep -R -nEi \
    "TODO|FIXME|placeholder|temporary|mock|stub|fallback|demo|sample" \
    "$path" \
    || true
}

inspect_imports() {
  local path="$1"

  grep -R -nE \
    "^import |from [\"']@/" \
    "$path" \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    || true
}

inspect_placeholders() {
  local path="$1"

  grep -R -nEi \
    "TODO|FIXME|placeholder|temporary|mock|stub|fallback|demo|sample|hardcoded" \
    "$path" \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    || true
}

inspect_duplicates() {
  local path="$1"

  find "$path" \
    -type f \
    \( \
      -name "*.ts" \
      -o -name "*.tsx" \
      -o -name "*.js" \
      -o -name "*.jsx" \
    \) \
    -print \
  | sed 's#.*/##' \
  | sort \
  | uniq -d
}

inspect_status() {
  echo "===== BRANCH ====="

  git branch --show-current

  echo
  echo "===== STATUS ====="

  git status --short

  echo
  echo "===== RECENT COMMITS ====="

  git log \
    --oneline \
    -10
}

command="${1:-}"

case "$command" in
  architecture)
    inspect_architecture
    ;;

  runtime)
    inspect_runtime
    ;;

  workspace)
    require_argument "${2:-}"
    inspect_workspace "$2"
    ;;

  imports)
    require_argument "${2:-}"
    inspect_imports "$2"
    ;;

  placeholders)
    require_argument "${2:-}"
    inspect_placeholders "$2"
    ;;

  duplicates)
    require_argument "${2:-}"
    inspect_duplicates "$2"
    ;;

  status)
    inspect_status
    ;;

  *)
    usage
    exit 2
    ;;
esac
