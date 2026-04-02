#!/bin/bash

FILE="app/api/dev/preview/route.ts"

# Replace jsx automatic with transform
sed -i '' 's/jsx: "automatic"/jsx: "transform"/' $FILE

echo "✅ Fixed JSX runtime (no react/jsx-runtime)"
