#!/bin/bash

FILE="app/api/dev/preview/route.ts"

perl -0777 -i -pe 's/\$\{code\}/\$\{code.replace\(\x2Fsrc=\\"\\\/\(\.\*\?\)\\"\/g, `src=\\"\\/api\\/dev\\/asset?projectId=\$\{projectId\}&file=\$1\\"`\)\}/' $FILE

echo "✅ Asset support added"
