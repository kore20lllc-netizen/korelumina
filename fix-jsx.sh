#!/bin/bash

apply_fix() {
  FILE=$1

  sed -i '' 's/jsx: "transform"/jsx: "transform",\
      jsxFactory: "React.createElement",\
      jsxFragment: "React.Fragment"/' "$FILE"
}

apply_fix app/api/dev/preview/route.ts
apply_fix app/api/dev/preview/debug/route.ts

echo "✔ JSX forced to React.createElement"
