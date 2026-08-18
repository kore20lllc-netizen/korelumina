#!/usr/bin/env bash

set -euo pipefail

ROOT="$(
  git rev-parse --show-toplevel
)"

cd "$ROOT"

TMP="$(
  mktemp
)"

trap 'rm -f "$TMP"' EXIT

find docs \
  \( -path 'docs/archive' -o -path 'docs/archive/*' \) -prune \
  -o \
  -type f \
  \( \
    -iname '*KNOWLEDGE*OPERATIONS*V1*.md' \
    -o \
    -iname '*KNOWLEDGE*OPERATIONS*V2*.md' \
    -o \
    -iname 'KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V1.md' \
    -o \
    -iname 'KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V2.md' \
  \) \
  -print \
  | sort \
  > "$TMP"

if [ -s "$TMP" ]; then
  echo
  echo "FAIL: superseded Knowledge Operations V1/V2 documents exist outside docs/archive."
  echo
  cat "$TMP"
  echo
  echo "V1/V2 Knowledge Operations documentation is historical-only."
  echo "Move it beneath docs/archive/knowledge-operations/."
  exit 1
fi

echo "PASS: Knowledge Operations V1/V2 documentation is quarantined from authoritative paths."
