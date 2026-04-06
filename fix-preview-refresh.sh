#!/bin/bash

FILE="app/builder/BuilderInner.tsx"

# Patch runAI to force preview refresh
perl -0777 -pi -e 's/async function runAI\(\) \{[\s\S]*?\}/async function runAI() {\n  const res = await fetch("\/api\/ai\/orchestrate", {\n    method: "POST",\n    headers: {\n      "Content-Type": "application\/json",\n    },\n    body: JSON.stringify({\n      projectId,\n      spec: prompt,\n    }),\n  });\n\n  const data = await res.json();\n\n  setPlan(data.files || []);\n  setDrafts(data.drafts || []);\n\n  \/\/ 🔥 force preview refresh\n  setVersion((v) => v + 1);\n}/s' "$FILE"

echo "✔ runAI patched with preview refresh"
