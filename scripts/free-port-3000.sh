#!/usr/bin/env bash
set -euo pipefail

PORT=3000
PIDS=$(lsof -ti tcp:$PORT || true)

if [ -n "${PIDS}" ]; then
  echo "Killing processes on port $PORT: $PIDS"
  kill -9 $PIDS || true
else
  echo "Port $PORT is free."
fi
