#!/usr/bin/env bash
set -e

echo "===== Architecture Scripts ====="
find scripts/architecture -maxdepth 2 -type f | sort

echo
echo "===== package.json tsx availability ====="
grep -n '"tsx"\|"ts-node"' package.json || true

echo
echo "===== Existing changelog ====="
tail -80 docs/architecture/ARCHITECTURE_CHANGELOG.md
