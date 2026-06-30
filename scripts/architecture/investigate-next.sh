#!/usr/bin/env bash
set -euo pipefail

echo "===== Project Metadata Store ====="
sed -n '1,220p' \
apps/lumina-runtime/src/projects/projectMetadataStore.ts

echo
echo "===== Draft Apply ====="
sed -n '1,220p' \
apps/lumina-runtime/src/drafts/applyDraft.ts

echo
echo "===== Draft Revert ====="
sed -n '1,220p' \
apps/lumina-runtime/src/drafts/revertDraft.ts

echo
echo "===== Remaining JsonStore usage ====="
grep -R "JsonStore" \
apps/lumina-runtime/src \
packages/platform-sdk/src \
-n || true

echo
echo "===== Remaining FileStore usage ====="
grep -R "FileStore" \
apps/lumina-runtime/src \
packages/platform-sdk/src \
-n || true
