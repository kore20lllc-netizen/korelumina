#!/bin/bash

FILE="app/api/dev/preview/route.ts"

# Inject Tailwind CDN into HTML head
perl -0777 -i -pe 's/<body/<head>\n    <script src="https:\/\/cdn.tailwindcss.com"><\/script>\n  <\/head>\n  <body/' $FILE

echo "✅ Tailwind CDN added to preview"
