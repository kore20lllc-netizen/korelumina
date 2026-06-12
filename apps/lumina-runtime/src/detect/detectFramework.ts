import fs from "node:fs";
import path from "node:path";

export type Framework =
  | "next"
  | "vite"
  | "react"
  | "vue"
  | "nuxt"
  | "monorepo"
  | "unknown";

export function detectFramework(
  projectPath: string,
): Framework {
  const packageJsonPath = path.join(
    projectPath,
    "package.json",
  );

  if (!fs.existsSync(packageJsonPath)) {
    return "unknown";
  }

  const pkg = JSON.parse(
    fs.readFileSync(
      packageJsonPath,
      "utf-8",
    ),
  );

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  if (deps.next) {
    return "next";
  }

  if (deps.vite) {
    return "vite";
  }

  if (deps.react && !deps.next && !deps.vite) {
    return "react";
  }

  if (deps.vue) {
    return "vue";
  }

  if (deps.nuxt) {
    return "nuxt";
  }

  // Check for monorepo indicators
  if (pkg.workspaces || fs.existsSync(path.join(projectPath, "pnpm-workspace.yaml"))) {
    return "monorepo";
  }

  return "unknown";
}
