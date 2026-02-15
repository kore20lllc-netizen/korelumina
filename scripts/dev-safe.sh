#!/bin/bash
pkill -9 node 2>/dev/null
rm -rf .next
npm run dev
