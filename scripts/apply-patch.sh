#!/usr/bin/env bash
set -euo pipefail

RAW="${1:-raw-patch.txt}"
WORKSPACE="${2:-default}"
PROJECT="${3:-kid-transit-eye}"
OUT="patch.json"

node scripts/patch-to-json.mjs "$RAW" "$OUT" "$WORKSPACE" "$PROJECT" 1>&2

curl -sS -X POST "http://localhost:3000/api/ai/apply" \
  -H "Content-Type: application/json" \
  --data-binary "@$OUT"
echo
