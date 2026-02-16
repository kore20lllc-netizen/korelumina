#!/usr/bin/env bash

set -e

PROJECT_ID="$1"

BASE_DIR="$HOME/Documents/korelumina/projects"
SOURCE_DIR="$BASE_DIR/$PROJECT_ID"

RUNTIME_DIR="$(pwd)/runtime"
WORKSPACE_DIR="$RUNTIME_DIR/workspaces/$PROJECT_ID"
LOG_DIR="$RUNTIME_DIR/projects/$PROJECT_ID"
LOG_FILE="$LOG_DIR/build.log"

mkdir -p "$WORKSPACE_DIR"
mkdir -p "$LOG_DIR"

echo "=== Build Started ===" > "$LOG_FILE"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source project not found: $SOURCE_DIR" >> "$LOG_FILE"
  exit 1
fi

# Clean previous workspace
rm -rf "$WORKSPACE_DIR"
mkdir -p "$WORKSPACE_DIR"

# Copy project into isolated workspace
cp -R "$SOURCE_DIR"/. "$WORKSPACE_DIR"/

cd "$WORKSPACE_DIR"

if [ ! -f "package.json" ]; then
  echo "No package.json in workspace" >> "$LOG_FILE"
  exit 1
fi

echo "Installing dependencies..." >> "$LOG_FILE"
npm install --legacy-peer-deps >> "$LOG_FILE" 2>&1

echo "Running build..." >> "$LOG_FILE"
npm run build >> "$LOG_FILE" 2>&1

echo "=== Build Finished with code $? ===" >> "$LOG_FILE"
