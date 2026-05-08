const fs = require("fs");
const path = require("path");

function exists(p) {
  return fs.existsSync(p);
}

function readJson(p) {
  try {
    return JSON.parse(
      fs.readFileSync(p, "utf8")
    );
  } catch {
    return null;
  }
}

function detectPackageManager(projectPath) {
  if (
    exists(path.join(projectPath, "bun.lockb")) ||
    exists(path.join(projectPath, "bun.lock"))
  ) {
    return "bun";
  }

  if (
    exists(path.join(projectPath, "pnpm-lock.yaml"))
  ) {
    return "pnpm";
  }

  if (
    exists(path.join(projectPath, "yarn.lock"))
  ) {
    return "yarn";
  }

  return "npm";
}

function getInstallCommand(pm) {
  if (pm === "bun") {
    return "bun install";
  }

  if (pm === "pnpm") {
    return "pnpm install";
  }

  if (pm === "yarn") {
    return "yarn install";
  }

  return "npm install";
}

function getDevCommand(pm, framework) {
  if (framework === "next") {
    if (pm === "bun") {
      return "bun run dev -- --port {PORT}";
    }

    if (pm === "pnpm") {
      return "pnpm dev -- --port {PORT}";
    }

    if (pm === "yarn") {
      return "yarn dev --port {PORT}";
    }

    return "npm run dev -- --port {PORT}";
  }

  if (framework === "vite") {
    if (pm === "bun") {
      return "bun run dev -- --port {PORT} --host 0.0.0.0";
    }

    if (pm === "pnpm") {
      return "pnpm dev -- --port {PORT} --host 0.0.0.0";
    }

    if (pm === "yarn") {
      return "yarn dev --port {PORT} --host 0.0.0.0";
    }

    return "npm run dev -- --port {PORT} --host 0.0.0.0";
  }

  return "npm run dev";
}

function detectFramework(projectPath) {
  const packageJsonPath =
    path.join(projectPath, "package.json");

  const pkg = readJson(packageJsonPath);

  const deps = {
    ...(pkg?.dependencies || {}),
    ...(pkg?.devDependencies || {}),
  };

  // NEXT
  if (
    deps.next ||
    exists(path.join(projectPath, "next.config.js")) ||
    exists(path.join(projectPath, "next.config.mjs")) ||
    exists(path.join(projectPath, "app")) ||
    exists(path.join(projectPath, "pages"))
  ) {
    return {
      framework: "next",
      runtime: "node",
      entry: exists(
        path.join(projectPath, "app/page.tsx")
      )
        ? "app/page.tsx"
        : "pages/index.tsx",
    };
  }

  // VITE
  if (
    deps.vite ||
    exists(path.join(projectPath, "vite.config.ts")) ||
    exists(path.join(projectPath, "vite.config.js"))
  ) {
    let entry = "src/main.tsx";

    if (
      exists(
        path.join(projectPath, "src/main.jsx")
      )
    ) {
      entry = "src/main.jsx";
    }

    if (
      exists(
        path.join(projectPath, "src/main.ts")
      )
    ) {
      entry = "src/main.ts";
    }

    return {
      framework: "vite",
      runtime: "browser",
      entry,
    };
  }

  // STATIC
  return {
    framework: "static",
    runtime: "browser",
    entry: "index.html",
  };
}

function detectProject(projectPath) {
  const packageManager =
    detectPackageManager(projectPath);

  const frameworkInfo =
    detectFramework(projectPath);

  return {
  framework:
    frameworkInfo.framework,

  runtime:
    frameworkInfo.runtime,

  packageManager:
    packageManager === "bun"
      ? "npm"
      : packageManager,

  installCommand:
    getInstallCommand(
      packageManager === "bun"
        ? "npm"
        : packageManager
    ),

  devCommand:
    getDevCommand(
      packageManager === "bun"
        ? "npm"
        : packageManager,
      frameworkInfo.framework
    ),

  entry:
    frameworkInfo.entry,
};
}

module.exports = {
  detectProject,
};
