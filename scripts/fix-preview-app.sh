#!/bin/bash

FILE="app/api/dev/preview/route.ts"

# Replace App assignment block
sed -i '' 's/const App =.*/const App = window.KoreApp?.default || window.KoreApp || window.Page || null;/' $FILE

echo "✅ Fixed preview App resolution"
