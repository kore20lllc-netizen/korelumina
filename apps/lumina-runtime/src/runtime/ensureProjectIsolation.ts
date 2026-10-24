import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import {
  projectProcessEnvironment,
} from "./projectProcessEnvironment.js";


const INSTALL_TIMEOUT_MS = 1000 * 60 * 10;

type PackageManager = {
  command: "npm" | "pnpm" | "yarn" | "bun";
  installArgs: string[];
};

function exists(filePath: string) {
  return fs.existsSync(filePath);
}

/*
 * F-50: every command here runs asynchronously. Installing dependencies
 * used to run synchronously, so while a project installed (up to ten
 * minutes) Runtime answered nothing else: the Executive Office, the
 * dashboard and every other request froze.
 */
function runAsync(
  command: string,
  args: string[],
  projectPath: string,
  options: { timeoutMs: number; inheritOutput: boolean; env: NodeJS.ProcessEnv },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectPath,
      shell: false,
      stdio: options.inheritOutput ? ["ignore", "inherit", "inherit"] : "ignore",
      env: options.env,
    });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5_000).unref();
    }, options.timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (signal) reject(new Error(`process_terminated:${signal}`));
      else if (code !== 0) reject(new Error(`process_exit_code:${code}`));
      else resolve();
    });
  });
}

const CHECK_TIMEOUT_MS = 60_000;

async function commandSucceeds(
  command: string,
  args: string[],
  projectPath: string,
): Promise<boolean> {
  try {
    await runAsync(command, args, projectPath, {
      timeoutMs: CHECK_TIMEOUT_MS,
      inheritOutput: false,
      /* SEC-1 (F-18): never Runtime's own environment. */
      env: projectProcessEnvironment({
        CI: "true",
        NODE_ENV: "development",
        BROWSER: "none",
      }),
    });
    return true;
  } catch {
    return false;
  }
}

async function swcBindingHealthy(projectPath: string): Promise<boolean> {
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

async function dependenciesHealthy(projectPath: string): Promise<boolean> {
  return (
    (await commandSucceeds(
      "npm",
      [
        "ls",
        "--depth=0",
      ],
      projectPath,
    )) &&
    (await swcBindingHealthy(projectPath))
  );
}

/*
 * F-50: a fingerprint of what the dependencies were installed from. After
 * a validated install Runtime records it in node_modules; while the
 * manifest and lockfiles are unchanged the dependencies are known good,
 * so a project whose tree `npm ls` dislikes (bun and pnpm trees often do)
 * is not deleted and reinstalled on every start.
 */
const INSTALL_MARKER = ".korelumina-install.json";
const DEPENDENCY_FILES = ["package.json", "package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml", "bun.lock", "bun.lockb"];

export function dependencyFingerprint(projectPath: string): string {
  const hash = crypto.createHash("sha256");
  for (const file of DEPENDENCY_FILES) {
    const full = path.join(projectPath, file);
    if (!fs.existsSync(full)) continue;
    hash.update(file);
    hash.update("\0");
    hash.update(fs.readFileSync(full));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function installMarkerMatches(projectPath: string): boolean {
  try {
    const marker = JSON.parse(fs.readFileSync(path.join(projectPath, "node_modules", INSTALL_MARKER), "utf8")) as { fingerprint?: string };
    return marker.fingerprint === dependencyFingerprint(projectPath);
  } catch {
    return false;
  }
}

function writeInstallMarker(projectPath: string, packageManager: string) {
  fs.writeFileSync(
    path.join(projectPath, "node_modules", INSTALL_MARKER),
    `${JSON.stringify({ fingerprint: dependencyFingerprint(projectPath), packageManager, installedAt: new Date().toISOString() })}\n`,
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

async function installDependencies(
  projectPath: string,
  packageManager: PackageManager,
): Promise<void> {
  console.log(
    `[runtime/isolation] installing dependencies using ${packageManager.command} --ignore-scripts`,
  );

  await runAsync(
    packageManager.command,
    packageManager.installArgs,
    projectPath,
    {
      inheritOutput: true,
      timeoutMs: INSTALL_TIMEOUT_MS,
      /* SEC-1 (F-18): never Runtime's own environment. */
      env: projectProcessEnvironment({
        CI: "true",
        NODE_ENV: "development",
        BROWSER: "none",
        npm_config_ignore_scripts: "true",
      }),
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

const inFlight = new Map<string, Promise<IsolationResult>>();

type IsolationResult = {
  isolated: true;
  dependenciesInstalled: true;
  installSkipped: boolean;
  packageManager?: string;
  projectPath: string;
};

/* F-50: two starts of the same project share one install instead of racing in one node_modules. */
export function ensureProjectIsolation(projectPath: string): Promise<IsolationResult> {
  const key = path.resolve(projectPath);
  const running = inFlight.get(key);
  if (running) return running;
  const work = isolate(projectPath).finally(() => inFlight.delete(key));
  inFlight.set(key, work);
  return work;
}

async function isolate(projectPath: string): Promise<IsolationResult> {
  if (!exists(projectPath)) {
    throw new Error(`project_path_missing:${projectPath}`);
  }

  validateProjectPath(projectPath);
  assertSafeScripts(projectPath);

  const nodeModulesPath = path.join(projectPath, "node_modules");

  if (
    exists(nodeModulesPath) &&
    (installMarkerMatches(projectPath) || (await dependenciesHealthy(projectPath)))
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

  await installDependencies(projectPath, packageManager);

  if (
    packageManager.command === "bun" &&
    !(await dependenciesHealthy(projectPath))
  ) {
    console.warn(
      "[runtime/isolation] bun install produced invalid dependencies; retrying with npm",
    );

    removeNodeModules(nodeModulesPath);
    await installDependencies(projectPath, npmFallbackPackageManager);
  }

  if (!exists(nodeModulesPath)) {
    throw new Error("node_modules_missing_after_install");
  }

  if (!(await dependenciesHealthy(projectPath))) {
    throw new Error("dependency_validation_failed_after_install");
  }

  writeInstallMarker(projectPath, packageManager.command);

  return {
    isolated: true,
    dependenciesInstalled: true,
    installSkipped: false,
    packageManager: packageManager.command,
    projectPath,
  };
}
