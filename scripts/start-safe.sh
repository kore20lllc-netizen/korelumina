#!/usr/bin/env bash

echo "Starting Korelumina SAFE MODE"

npm run clean
rm -rf .next

npm run dev &

sleep 10

./scripts/watchdog.sh
