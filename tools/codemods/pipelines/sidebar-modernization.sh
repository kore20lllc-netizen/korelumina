#!/usr/bin/env bash
set -euo pipefail

FILE="${1:-apps/lumina-builder/src/components/layout/Sidebar.tsx}"

echo "== Sidebar Modernization Pipeline =="
echo "Target: $FILE"

run() {
  local transform="$1"

  if [ ! -f "$transform" ]; then
    echo "Missing transform:"
    echo "  $transform"
    exit 1
  fi

  echo
  echo "Running $(basename "$transform")"

  npx jscodeshift \
    -t "$transform" \
    "$FILE"
}

run tools/codemods/transforms/sidebar-navigation-item.js
run tools/codemods/transforms/sidebar-navigation-section.js
run tools/codemods/transforms/sidebar-navigation-footer.js
run tools/codemods/transforms/sidebar-navigation-footer-wrapper.js
run tools/codemods/transforms/sidebar-navigation-footer-wrapper-v2.js

echo
echo "Pipeline complete."
