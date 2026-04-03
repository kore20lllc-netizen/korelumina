import path from "path";
import fs from "fs";

export function resolveEntry(projectRoot: string) {
  const candidates = [
    "app/page.tsx",
    "app/page.ts",
    "app/page.jsx",
    "app/page.js",
    "src/app/page.tsx",
    "src/app/page.ts",
    "src/app/page.jsx",
    "src/app/page.js",
  ];

  for (const file of candidates) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  throw new Error("No valid entry file found");
}
