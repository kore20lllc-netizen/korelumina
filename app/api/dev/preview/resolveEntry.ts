import fs from "fs";
import path from "path";

export function resolveEntry(projectRoot: string): string {
  const candidates = [
    // 🔥 PRIORITY: imported repo entry
    "dashboard/final-example/app/page.tsx",

    // fallback
    "app/page.tsx",
    "app/page.ts",
  ];

  for (const file of candidates) {
    const full = path.join(projectRoot, file);

    if (fs.existsSync(full)) {
      console.log("ENTRY:", file); // debug visibility
      return full;
    }
  }

  throw new Error("No valid entry found");
}
