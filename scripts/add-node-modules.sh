#!/bin/bash

FILE="app/api/dev/preview/route.ts"

# Replace esbuild build config block
perl -0777 -i -pe 's/const result = await esbuild.build\([\s\S]*?\);\n/const result = await esbuild.build({\n      entryPoints: [entryFile],\n      bundle: true,\n      write: false,\n      platform: \"browser\",\n      format: \"iife\",\n      globalName: \"KoreApp\",\n      jsx: \"transform\",\n      loader: {\n        \".ts\": \"ts\",\n        \".tsx\": \"tsx\",\n        \".css\": \"empty\",\n      },\n      resolveExtensions: EXTENSIONS,\n\n      // 🔥 allow node_modules resolution\n      nodePaths: [path.join(process.cwd(), \"node_modules\")],\n\n      plugins: [\n        {\n          name: \"resolve-local\",\n          setup(build) {\n            build.onResolve({ filter: /^@\\// }, args => {\n              const base = path.join(projectRoot, args.path.replace(\"@/\", \"\"));\n              const resolved = resolveWithExtensions(base);\n              if (!resolved) throw new Error(\"Cannot resolve \" + base);\n              return { path: resolved };\n            });\n\n            build.onResolve({ filter: /^\\.\\.?\// }, args => {\n              const base = path.join(path.dirname(args.importer), args.path);\n              const resolved = resolveWithExtensions(base);\n              if (!resolved) throw new Error(\"Cannot resolve \" + base);\n              return { path: resolved };\n            });\n          }\n        }\n      ],\n\n      external: [\"react\", \"react-dom\"],\n    });\n/' $FILE

echo "✅ node_modules support added"
