#!/bin/bash
PROJECT_ID=$1

cd projects/$PROJECT_ID || exit 1
npm install --no-audit --no-fund
npm run build
