#!/bin/bash

FILE="app/api/dev/preview/route.ts"

# Replace .default usage
sed -i '' 's/window.KoreApp\\?\\.default/window.KoreApp/' $FILE

echo "✅ Fixed preview mount (removed .default)"
