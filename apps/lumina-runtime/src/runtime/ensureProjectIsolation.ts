import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  runCommandSync,
} from "@korelumina/platform-sdk";


const INSTALL_TIMEOUT_MS = 1000 * 60 * 10;

type PackageManager = {
  command: "npm" | "pnpm" | "yarn" | "bun";
  installArgs: string[];
};

function exists(filePath: string) {
  return fs.existsSync(filePath);
}

function commandSucceeds(
  command: string,
  args: string[],
  projectPath: string,
) {
  try {
    execFileSync(
      command,
      args,
      {
        cwd: projectPath,
        stdio: "ignore",
        env: {
          ...process.env,
          CI: "true",
          NODE_ENV: "development",
          BROWSER: "none",
        },
      },
    );

    return true;
  } catch {
    return false;
  }
}

function swcBindingHealthy(projectPath: string) {
  const packageJsonPath = path.join(
    projectPath,
    "node_modules",
    "@swc",
    "core",
    "package.json",
  );

  if (!exists(packageJsonPath)) {
    return true;
  }

  return commandSucceeds(
    "node",
    [
      "-e",
      "require('@swc/core')",
    ],
    projectPath,
  );
}

function dependenciesHealthy(projectPath: string) {
  return (
    commandSucceeds(
      "npm",
      [
        "ls",
        "--depth=0",
      ],
      projectPath,
    ) &&
    swcBindingHealthy(projectPath)
  );
}

function removeNodeModules(nodeModulesPath: string) {
  fs.rmSync(
    nodeModulesPath,
    {
      recursive: true,
      force: true,
    },
  );
}

function installDependencies(
  projectPath: string,
  packageManager: PackageManager,
) {
  console.log(
    `[runtime/isolation] installing dependencies using ${packageManager.command} --ignore-scripts`,
  );

  runCommandSync(
    packageManager.command,
    packageManager.installArgs,
    {
      cwd: projectPath,
      shell: false,
      stdio: "inherit",
      timeout: INSTALL_TIMEOUT_MS,
      env: {
        ...process.env,
        CI: "true",
        NODE_ENV: "development",
        BROWSER: "none",
        npm_config_ignore_scripts: "true",
      },
    },
  );
}

const npmFallbackPackageManager: PackageManager = {
  command: "npm",
  installArgs: [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ],
};


function validateProjectPath(projectPath: string) {
  const stats = fs.lstatSync(projectPath);

  if (!stats.isDirectory()) {
    throw new Error("project_path_not_directory");
  }

  if (stats.isSymbolicLink()) {
    throw new Error("symlinked_project_not_allowed");
  }
}

function readPackageJson(projectPath: string) {
  const packageJsonPath = path.join(projectPath, "package.json");

  if (!exists(packageJsonPath)) {
    throw new Error("missing_package_json");
  }

  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
}

function assertSafeScripts(projectPath: string) {
  const pkg = readPackageJson(projectPath);
  const scripts = pkg.scripts ?? {};

  const dangerousScriptNames = [
    "preinstall",
    "install",
    "postinstall",
    "prepare",
    "prepublish",
    "prepublishOnly",
  ];

  const dangerousTokens = [
    "rm -rf",
    "sudo ",
    "chmod ",
    "chown ",
    "curl ",
    "wget ",
    "nc ",
    "netcat ",
    "ssh ",
    "scp ",
    "rsync ",
    "openssl ",
    "mkfs",
    "dd ",
    ":(){",
  ];

  for (const scriptName of dangerousScriptNames) {
    const script = scripts[scriptName];

    if (typeof script === "string" && script.trim()) {
      throw new Error(`blocked_lifecycle_script:${scriptName}`);
    }
  }

  for (const [name, value] of Object.entries(scripts)) {
    if (typeof value !== "string") continue;

    const lowered = value.toLowerCase();

    for (const token of dangerousTokens) {
      if (lowered.includes(token)) {
        throw new Error(`blocked_dangerous_script:${name}`);
      }
    }
  }
}

function detectDeclaredPackageManager(
  projectPath: string,
): PackageManager | null {
  const pkg = readPackageJson(projectPath);

  if (typeof pkg.packageManager !== "string") {
    return null;
  }

  switch (pkg.packageManager.split("@")[0]) {
    case "pnpm":
      return {
        command: "pnpm",
        installArgs: [
          "install",
          "--frozen-lockfile",
          "--ignore-scripts",
        ],
      };

    case "yarn":
      return {
        command: "yarn",
        installArgs: [
          "install",
          "--frozen-lockfile",
          "--ignore-scripts",
        ],
      };

    case "npm":
      return {
        command: "npm",
        installArgs: [
          "install",
          "--ignore-scripts",
          "--no-audit",
          "--no-fund",
        ],
      };

    case "bun":
      return {
        command: "bun",
        installArgs: [
          "install",
          "--ignore-scripts",
        ],
      };
  }

  return null;
}

function detectPackageManager(projectPath: string): PackageManager {
  const declared =
    detectDeclaredPackageManager(projectPath);

  if (declared) {
    return declared;
  }
  if (exists(path.join(projectPath, "pnpm-lock.yaml"))) {
    return {
      command: "pnpm",
      installArgs: ["install", "--frozen-lockfile", "--ignore-scripts"],
    };
  }

  if (exists(path.join(projectPath, "yarn.lock"))) {
    return {
      command: "yarn",
      installArgs: ["install", "--frozen-lockfile", "--ignore-scripts"],
    };
  }

  if (
    exists(path.join(projectPath, "package-lock.json"))
  ) {
    return {
      command: "npm",
      installArgs: [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
      ],
    };
  }

  if (
    exists(path.join(projectPath, "bun.lockb")) ||
    exists(path.join(projectPath, "bun.lock"))
  ) {
    return {
      command: "bun",
      installArgs: ["install", "--ignore-scripts"],
    };
  }

  return {
    command: "npm",
    installArgs: ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
  };
}

export function ensureProjectIsolation(projectPath: string) {
  if (!exists(projectPath)) {
    throw new Error(`project_path_missing:${projectPath}`);
  }

  validateProjectPath(projectPath);
  assertSafeScripts(projectPath);

  const nodeModulesPath = path.join(projectPath, "node_modules");

  if (
    exists(nodeModulesPath) &&
    dependenciesHealthy(projectPath)
  ) {
    return {
      isolated: true,
      dependenciesInstalled: true,
      installSkipped: true,
      projectPath,
    };
  }

  if (exists(nodeModulesPath)) {
    console.warn(
      "[runtime/isolation] dependency validation failed; reinstalling dependencies",
    );

    removeNodeModules(nodeModulesPath);
  }

  const packageManager = detectPackageManager(projectPath);

  installDependencies(projectPath, packageManager);

  if (
    packageManager.command === "bun" &&
    !dependenciesHealthy(projectPath)
  ) {
    console.warn(
      "[runtime/isolation] bun install produced invalid dependencies; retrying with npm",
    );

    removeNodeModules(nodeModulesPath);
    installDependencies(projectPath, npmFallbackPackageManager);
  }

  if (!exists(nodeModulesPath)) {
    throw new Error("node_modules_missing_after_install");
  }

  if (!dependenciesHealthy(projectPath)) {
    throw new Error("dependency_validation_failed_after_install");
  }

  return {
    isolated: true,
    dependenciesInstalled: true,
    installSkipped: false,
    packageManager: packageManager.command,
    projectPath,
  };
}
