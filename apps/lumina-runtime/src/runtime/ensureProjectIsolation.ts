import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function exists(filePath: string) {
  return fs.existsSync(filePath);
}

function detectPackageManager(
  projectPath: string,
) {
  if (
    exists(
      path.join(
        projectPath,
        "pnpm-lock.yaml",
      ),
    )
  ) {
    return {
      command: "pnpm",
      installArgs: [
        "install",
        "--frozen-lockfile",
      ],
    };
  }

  if (
    exists(
      path.join(
        projectPath,
        "bun.lockb",
      ),
    ) ||
    exists(
      path.join(
        projectPath,
        "bun.lock",
      ),
    )
  ) {
    return {
      command: "bun",
      installArgs: [
        "install",
      ],
    };
  }

  if (
    exists(
      path.join(
        projectPath,
        "yarn.lock",
      ),
    )
  ) {
    return {
      command: "yarn",
      installArgs: [
        "install",
        "--frozen-lockfile",
      ],
    };
  }

  return {
    command: "npm",
    installArgs: [
      "install",
    ],
  };
}

export function ensureProjectIsolation(
  projectPath: string,
) {
  if (
    !exists(projectPath)
  ) {
    throw new Error(
      `Project path does not exist: ${projectPath}`,
    );
  }

  const packageJsonPath =
    path.join(
      projectPath,
      "package.json",
    );

  if (
    !exists(packageJsonPath)
  ) {
    throw new Error(
      `Missing package.json: ${projectPath}`,
    );
  }

  const nodeModulesPath =
    path.join(
      projectPath,
      "node_modules",
    );

  if (
    exists(nodeModulesPath)
  ) {
    return {
      isolated: true,
      projectPath,
      dependenciesInstalled: true,
    };
  }

  const packageManager =
    detectPackageManager(
      projectPath,
    );

  console.log(
    `[runtime] installing dependencies using ${packageManager.command} in ${projectPath}`,
  );

  const install =
    spawnSync(
      packageManager.command,
      packageManager.installArgs,
      {
        cwd: projectPath,
        shell: false,
        stdio: "inherit",
        env: {
          ...process.env,
          CI: "true",
        },
        timeout: 1000 * 60 * 10,
      },
    );

  if (install.error) {
    throw new Error(
      `[runtime] dependency install failed: ${install.error.message}`,
    );
  }

  if (
    install.status !== 0
  ) {
    throw new Error(
      `[runtime] dependency install exited with code ${install.status}`,
    );
  }

  if (
    !exists(nodeModulesPath)
  ) {
    throw new Error(
      "[runtime] install completed but node_modules missing",
    );
  }

  return {
    isolated: true,
    projectPath,
    dependenciesInstalled: true,
  };
}
