const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const installs = new Map();

function hasNodeModules(projectPath) {
  return fs.existsSync(
    path.join(projectPath, "node_modules")
  );
}

function hasPackageJson(projectPath) {
  return fs.existsSync(
    path.join(projectPath, "package.json")
  );
}

function sleep(ms) {
  return new Promise((r) =>
    setTimeout(r, ms)
  );
}

async function waitForInstall(projectId) {
  while (installs.has(projectId)) {
    await sleep(500);
  }
}

function buildInstallCommand(pm) {
  switch (pm) {
    case "bun":
      return {
        cmd: "bun",
        args: ["install"],
      };

    case "pnpm":
      return {
        cmd: "pnpm",
        args: ["install"],
      };

    case "yarn":
      return {
        cmd: "yarn",
        args: [],
      };

    default:
      return {
        cmd: "npm",
        args: ["install"],
      };
  }
}

async function installDependencies({
  projectId,
  projectPath,
  packageManager,
}) {
  if (!hasPackageJson(projectPath)) {
    return {
      ok: false,
      skipped: true,
      reason: "No package.json",
    };
  }

  // already installed
  if (hasNodeModules(projectPath)) {
    return {
      ok: true,
      skipped: true,
      reason: "Dependencies already installed",
    };
  }

  // prevent duplicate installs
  if (installs.has(projectId)) {
    await waitForInstall(projectId);

    return {
      ok: true,
      reused: true,
    };
  }

  const installState = {
    status: "installing",
    startedAt: Date.now(),
    logs: [],
  };

  installs.set(
    projectId,
    installState
  );

  try {
    const command =
      buildInstallCommand(
        packageManager
      );

    console.log(
      `[install-manager] installing ${projectId} using ${packageManager}`
    );

    const proc = spawn(
      command.cmd,
      command.args,
      {
        cwd: projectPath,
        shell: true,
        env: {
          ...process.env,
          FORCE_COLOR: "1",
        },
      }
    );

    proc.stdout.on(
      "data",
      (data) => {
        const line =
          data.toString();

        installState.logs.push(line);

        process.stdout.write(line);
      }
    );

    proc.stderr.on(
      "data",
      (data) => {
        const line =
          data.toString();

        installState.logs.push(line);

        process.stderr.write(line);
      }
    );

    const exitCode =
      await new Promise(
        (resolve) => {
          proc.on(
            "close",
            resolve
          );
        }
      );

    if (exitCode !== 0) {
      throw new Error(
        `Install failed (${exitCode})`
      );
    }

    installState.status =
      "complete";

    installState.completedAt =
      Date.now();

    console.log(
      `[install-manager] install complete for ${projectId}`
    );

    return {
      ok: true,
      installed: true,
    };
  } catch (err) {
    installState.status =
      "failed";

    installState.error =
      err.message;

    console.error(
      `[install-manager] failed for ${projectId}`,
      err
    );

    return {
      ok: false,
      error:
        err.message ||
        "Install failed",
    };
  } finally {
    installs.delete(projectId);
  }
}

module.exports = {
  installDependencies,
};
