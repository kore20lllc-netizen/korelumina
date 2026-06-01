import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const INSTALL_TIMEOUT_MS = 1000 * 60 * 10;

type PackageManager = {
  command: "npm" | "pnpm" | "yarn" | "bun";
  installArgs: string[];
};

function exists(filePath: string) {
  return fs.existsSync(filePath);
}

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

function detectPackageManager(projectPath: string): PackageManager {
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

  if (exists(nodeModulesPath)) {
    return {
      isolated: true,
      dependenciesInstalled: true,
      installSkipped: true,
      projectPath,
    };
  }

  const packageManager = detectPackageManager(projectPath);

  console.log(
    `[runtime/isolation] installing dependencies using ${packageManager.command} --ignore-scripts`,
  );

  const install = spawnSync(packageManager.command, packageManager.installArgs, {
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
  });

  if (install.error) {
    throw new Error(`[runtime/install_failed] ${install.error.message}`);
  }

  if (install.signal) {
    throw new Error(`[runtime/install_terminated] ${install.signal}`);
  }

  if (install.status !== 0) {
    throw new Error(`[runtime/install_exit_code] ${install.status}`);
  }

  if (!exists(nodeModulesPath)) {
    throw new Error("node_modules_missing_after_install");
  }

  return {
    isolated: true,
    dependenciesInstalled: true,
    installSkipped: false,
    packageManager: packageManager.command,
    projectPath,
  };
}
