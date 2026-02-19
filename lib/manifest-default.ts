import fs from "fs";
import path from "path";

export function ensureManifest(projectRoot: string) {
  const manifestPath = path.join(
    projectRoot,
    "korelumina.manifest.json"
  );

  if (fs.existsSync(manifestPath)) return;

  const defaultManifest = {
    name: path.basename(projectRoot),
    framework: "vite",
    rootDir: "src",
    outputDir: "dist",
    entry: "main.tsx"
  };

  fs.writeFileSync(
    manifestPath,
    JSON.stringify(defaultManifest, null, 2)
  );
}
