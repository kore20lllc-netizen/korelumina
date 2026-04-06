#!/bin/bash

apply_fix() {
  FILE=$1

  # replace jsx config block safely
  perl -0777 -pi -e 's/jsx:\s*"transform"/jsx: "transform",\
      jsxFactory: "React.createElement",\
      jsxFragment: "React.Fragment"/g' "$FILE"
}

apply_fix app/api/dev/preview/route.ts
apply_fix app/api/dev/preview/debug/route.ts

echo "✔ Forced classic React JSX mode"
