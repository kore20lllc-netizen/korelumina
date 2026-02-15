#!/usr/bin/env bash

APP_PORT=3000
PROJECT_ROOT="$(pwd)"
LOG_FILE="$PROJECT_ROOT/runtime/watchdog.log"

mkdir -p runtime
touch "$LOG_FILE"

log() {
  echo "[$(date)] $1" >> "$LOG_FILE"
}

check_health() {
  curl -sf http://localhost:$APP_PORT/api/health > /dev/null
}

restart_server() {
  log "Restarting server..."

  pkill -f "next dev" || true
  pkill -f "node.*next" || true

  rm -rf .next

  npm run dev >> "$LOG_FILE" 2>&1 &
  sleep 8
}

log "Watchdog started"

while true; do
  if check_health; then
    log "Health OK"
  else
    log "Health FAILED"
    restart_server
  fi

  sleep 20
done
