#!/bin/bash

FILE="app/builder/BuilderInner.tsx"

# Remove draft removal line safely
sed -i '' '/setDrafts((prev)/,/));/d' "$FILE"

echo "✔ Removed draft auto-delete on apply (Apply button will persist)"

npm run dev
