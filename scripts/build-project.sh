#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-}"
if [[ -z "${PROJECT_ID}" ]]; then
  echo "Missing project id"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="${REPO_ROOT}/projects/${PROJECT_ID}"

if [[ ! -d "${PROJECT_DIR}" ]]; then
  echo "Project directory not found: ${PROJECT_DIR}"
  exit 1
fi

cd "${PROJECT_DIR}"

# Install + build
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

npm run build
