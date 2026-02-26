#!/usr/bin/env bash
set -euo pipefail

ROOT="runtime/workspaces/default/projects/kid-transit-eye"
BAD_DIR="${ROOT}/\`\`\`src"

echo "[clean] checking: ${BAD_DIR}"
if [ -d "${BAD_DIR}" ]; then
  echo "[clean] removing bad dir: ${BAD_DIR}"
  rm -rf "${BAD_DIR}"
  echo "[clean] removed"
else
  echo "[clean] nothing to remove"
fi
