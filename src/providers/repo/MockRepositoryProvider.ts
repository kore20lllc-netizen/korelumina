import { AppError } from "@/lib/errors";
import { uid } from "@/lib/persistence";
import type { Framework, ImportedRepo, RepositoryProvider } from "@/providers/types";

function detectFromPkg(pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; workspaces?: unknown }): Framework {
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  if (pkg.workspaces) return "monorepo";
  if (all["next"]) return "next";
  if (all["nuxt"]) return "nuxt";
  if (all["vue"]) return "vue";
  if (all["vite"]) return "vite";
  if (all["react"]) return "react";
  return "unknown";
}

function syntheticPkg(name: string) {
  return {
    name, version: "0.1.0",
    dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" },
    devDependencies: { vite: "^5.4.0", typescript: "^5.4.0" },
  };
}

function makeRepo(name: string, source: ImportedRepo["source"], files: Record<string, string>): ImportedRepo {
  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; workspaces?: unknown } = syntheticPkg(name);
  try { if (files["package.json"]) pkg = JSON.parse(files["package.json"]); } catch {}
  const framework = detectFromPkg(pkg);
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const depCount = Object.keys(deps).length;
  const fileCount = Object.keys(files).length;
  const complexity: ImportedRepo["complexity"] = fileCount > 200 || depCount > 80 ? "high" : fileCount > 60 || depCount > 30 ? "medium" : "low";
  return {
    id: uid("repo"), source, name, framework, files, dependencies: deps, complexity,
    summary: `${framework.toUpperCase()} project — ${fileCount} files, ${depCount} dependencies, ${complexity} complexity.`,
    importedAt: Date.now(),
  };
}

export class MockRepositoryProvider implements RepositoryProvider {
  async importFromGithub(url: string, onProgress?: (pct: number, label: string) => void) {
    const m = url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
    if (!m) throw new AppError("VALIDATION", "Provide a valid GitHub URL.");
    const name = m[2].replace(/\.git$/, "");
    const stages: Array<[number, string]> = [[15, "Fetching repository"], [40, "Reading manifest"], [65, "Building file tree"], [85, "Detecting framework"], [100, "Finalizing"]];
    for (const [pct, label] of stages) { onProgress?.(pct, label); await new Promise((r) => setTimeout(r, 250)); }
    const files: Record<string, string> = {
      "package.json": JSON.stringify(syntheticPkg(name), null, 2),
      "README.md": `# ${name}\n\nImported from ${url}\n`,
      "src/main.tsx": "// entry\n",
      "src/App.tsx": "export default function App(){return <div/>}\n",
      "tsconfig.json": "{}\n",
      "vite.config.ts": "export default {}\n",
    };
    return makeRepo(name, "github", files);
  }
  async importFromZip(file: File, onProgress?: (pct: number, label: string) => void) {
    if (!file.name.toLowerCase().endsWith(".zip")) throw new AppError("VALIDATION", "Upload a .zip file.");
    const stages: Array<[number, string]> = [[20, "Reading archive"], [55, "Extracting files"], [85, "Detecting framework"], [100, "Finalizing"]];
    for (const [pct, label] of stages) { onProgress?.(pct, label); await new Promise((r) => setTimeout(r, 250)); }
    const name = file.name.replace(/\.zip$/i, "");
    const files: Record<string, string> = {
      "package.json": JSON.stringify(syntheticPkg(name), null, 2),
      "README.md": `# ${name}\n`,
    };
    return makeRepo(name, "zip", files);
  }
}