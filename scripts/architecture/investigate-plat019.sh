#!/usr/bin/env bash
set -euo pipefail

echo "===== Draft Apply ====="
sed -n '1,240p' \
apps/lumina-runtime/src/drafts/applyDraft.ts

echo
echo "===== Draft Revert ====="
sed -n '1,220p' \
apps/lumina-runtime/src/drafts/revertDraft.ts

echo
echo "===== Platform SDK FileSystem ====="
sed -n '1,220p' \
packages/platform-sdk/src/filesystem/FileSystem.ts

echo
echo "===== Platform SDK AtomicWriter ====="
sed -n '1,220p' \
packages/platform-sdk/src/filesystem/AtomicWriter.ts

echo
echo "===== Platform SDK PathUtils ====="
sed -n '1,220p' \
packages/platform-sdk/src/filesystem/PathUtils.ts

echo
echo "===== Platform SDK exports ====="
sed -n '1,200p' \
packages/platform-sdk/src/filesystem/index.ts
