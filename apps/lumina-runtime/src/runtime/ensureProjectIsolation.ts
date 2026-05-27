import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const INSTALL_TIMEOUT_MS =
  1000 * 60 * 10;

function exists(
  filePath: string,
) {
  return fs.existsSync(filePath);
}

function validateProjectPath(
  projectPath: string,
) {
  const stats =
    fs.lstatSync(projectPath);

  if (!stats.isDirectory()) {
    throw new Error(
      "project_path_not_directory",
    );
  }

  if (stats.isSymbolicLink()) {
    throw new Error(
      "symlinked_project_not_allowed",
    );
  }
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

  return {
    command: "npm",
    installArgs: [
      "install",
      "--no-audit",
      "--no-fund",
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
      `project_path_missing:${projectPath}`,
    );
  }

  validateProjectPath(
    projectPath,
  );

  const packageJsonPath =
    path.join(
      projectPath,
      "package.json",
    );

  if (
    !exists(packageJsonPath)
  ) {
    throw new Error(
      "missing_package_json",
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
      dependenciesInstalled: true,
      projectPath,
    };
  }

  const packageManager =
    detectPackageManager(
      projectPath,
    );

  console.log(
    `[runtime/isolation] installing dependencies using ${packageManager.command}`,
  );

  const install =
    spawnSync(
      packageManager.command,
      packageManager.installArgs,
      {
        cwd: projectPath,
        shell: false,
        stdio: "inherit",
        timeout:
          INSTALL_TIMEOUT_MS,
        env: {
          ...process.env,
          CI: "true",
          NODE_ENV:
            "development",
          BROWSER:
            "none",
        },
      },
    );

  if (install.error) {
    throw new Error(
      `[runtime/install_failed] ${install.error.message}`,
    );
  }

  if (
    install.signal
  ) {
    throw new Error(
      `[runtime/install_terminated] ${install.signal}`,
    );
  }

  if (
    install.status !== 0
  ) {
    throw new Error(
      `[runtime/install_exit_code] ${install.status}`,
    );
  }

  if (
    !exists(nodeModulesPath)
  ) {
    throw new Error(
      "node_modules_missing_after_install",
    );
  }

  return {
    isolated: true,
    dependenciesInstalled: true,
    projectPath,
  };
}
