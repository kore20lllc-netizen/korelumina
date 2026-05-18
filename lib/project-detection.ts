import fs from "fs";
import path from "path";

export type DetectedProject = {
  framework: string;
  runtime: string;
  packageManager: string;
  installCommand: string | null;
  devCommand: string | null;
  entry: string | null;
};

export function detectProject(projectPath: string): DetectedProject {
  const packageJsonPath = path.join(projectPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return {
      framework: "unknown",
      runtime: "unknown",
      packageManager: "unknown",
      installCommand: null,
      devCommand: null,
      entry: null,
    };
  }

  let pkg: any = {};

  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  } catch {
    pkg = {};
  }

  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  let framework = "unknown";
  let runtime = "node";
  let entry: string | null = null;

  if (deps.next) {
    framework = "nextjs";
    entry = "app/page.tsx";
  } else if (deps.vite) {
    framework = "vite";
    entry = "src/main.tsx";
  } else if (deps.react) {
    framework = "react";
    entry = "src/App.tsx";
  }

  let packageManager = "npm";
  if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) {
    packageManager = "pnpm";
  } else if (fs.existsSync(path.join(projectPath, "yarn.lock"))) {
    packageManager = "yarn";
  }

  const installCommand =
    packageManager === "pnpm"
      ? "pnpm install"
      : packageManager === "yarn"
      ? "yarn"
      : "npm install";

  const devCommand =
    packageManager === "pnpm"
      ? "pnpm dev"
      : packageManager === "yarn"
      ? "yarn dev"
      : "npm run dev";

  return {
    framework,
    runtime,
    packageManager,
    installCommand,
    devCommand,
    entry,
  };
}
