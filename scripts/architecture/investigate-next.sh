#!/usr/bin/env bash
set -euo pipefail

echo "===== Remaining duplicated filesystem APIs ====="
grep -R \
"readdirSync\|writeFileSync\|readFileSync\|mkdirSync\|renameSync\|unlinkSync" \
apps/lumina-runtime/src \
packages \
-n || true

echo
echo "===== Remaining Platform SDK candidates ====="
grep -R \
"JSON.parse(fs.readFileSync\|JSON.stringify(.*null, 2" \
apps/lumina-runtime/src \
packages \
-n || true

echo
echo "===== Remaining custom recursive walkers ====="
grep -R \
"function walk\|function walkFiles\|function visit" \
apps/lumina-runtime/src \
packages \
-n || true

echo
echo "===== Platform SDK adoption ====="
grep -R \
"@korelumina/platform-sdk" \
apps/lumina-runtime/src \
-n || true

echo
echo "===== Architecture changelog ====="
tail -80 docs/architecture/ARCHITECTURE_CHANGELOG.md
