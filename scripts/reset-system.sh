#!/usr/bin/env bash

echo "🔄 Resetting Korelumina system..."

# Kill stray node processes
pkill -f "next dev" || true
pkill -f "vite" || true
pkill -f "npm run dev" || true

# Clear caches
rm -rf .next
rm -rf node_modules/.cache
rm -rf runtime

# Reinstall
npm install

echo "✅ System reset complete"
