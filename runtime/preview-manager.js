const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const {
  detectProject,
} = require("./framework-detector");

const {
  installDependencies,
} = require("./install-manager");

const {
  watchProject,
  unwatchProject,
} = require("./preview-events");

const projects = new Map();
const starting = new Map();

const BASE_PORT = 3001;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getProjectPath(projectId) {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
  );
}

function isProcessAlive(proc) {
  return (
    proc &&
    !proc.killed &&
    proc.exitCode === null
  );
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket
      .once("connect", () => {
        socket.destroy();
        resolve(true);
      })
      .once("error", () => {
        resolve(false);
      });

    socket.connect(
      port,
      "127.0.0.1",
    );
  });
}

async function waitForServer(
  port,
  retries = 60,
) {
  for (let i = 0; i < retries; i++) {
    if (await isPortOpen(port)) {
      return true;
    }

    await sleep(500);
  }

  return false;
}

async function findAvailablePort(
  start = BASE_PORT,
) {
  let port = start;

  while (await isPortOpen(port)) {
    port++;
  }

  return port;
}

function normalizeCommand(command) {
  if (!command || typeof command !== "string") {
    throw new Error("Missing runtime command");
  }

  return command.trim();
}

async function startProject(projectId) {
  if (!projectId) {
    throw new Error("Missing projectId");
  }

  const existing =
    projects.get(projectId);

  if (
    existing &&
    isProcessAlive(existing.process)
  ) {
    const alive =
      await isPortOpen(existing.port);

    if (alive) {
      return existing;
    }

    try {
      existing.process.kill("SIGTERM");
    } catch {
      // ignore stale process cleanup errors
    }

    projects.delete(projectId);
    unwatchProject(projectId);
  }

  if (starting.has(projectId)) {
    return starting.get(projectId);
  }

  const startPromise =
    (async () => {
      const projectPath =
        getProjectPath(projectId);

      const projectInfo =
        detectProject(projectPath);

      const installResult =
        await installDependencies({
          projectId,
          projectPath,
          packageManager:
            projectInfo.packageManager,
        });

      if (
        installResult &&
        installResult.ok === false &&
        !installResult.skipped
      ) {
        throw new Error(
          installResult.error ||
            installResult.reason ||
            "Dependency install failed",
        );
      }

      const port =
        await findAvailablePort();

      const framework =
        projectInfo.framework;

      const rawCommand =
        normalizeCommand(
          projectInfo.devCommand,
        ).replace(
          /\{PORT\}/g,
          String(port),
        );

      console.log(
        `[preview-manager] framework=${framework}`,
      );

      console.log(
        `[preview-manager] starting ${projectId} on ${port}`,
      );

      console.log(
        `[preview-manager] command=${rawCommand}`,
      );

      const proc = spawn(
        rawCommand,
        [],
        {
          cwd: projectPath,
          stdio: "inherit",
          shell: true,
          env: {
            ...process.env,
            PORT: String(port),
            HOST: "0.0.0.0",
            FORCE_COLOR: "1",
          },
        },
      );

      const record = {
        projectId,
        projectPath,
        framework,
        runtime:
          projectInfo.runtime,
        packageManager:
          projectInfo.packageManager,
        entry:
          projectInfo.entry,
        port,
        process: proc,
        ready: false,
        status: "starting",
        startedAt:
          Date.now(),
        pid:
          proc.pid,
        error: null,
      };

      projects.set(
        projectId,
        record,
      );

      proc.on("exit", (code) => {
        console.log(
          `[preview-manager] ${projectId} stopped (${code})`,
        );

        const current =
          projects.get(projectId);

        if (
          current &&
          current.process === proc
        ) {
          current.ready = false;
          current.status =
            code === 0
              ? "stopped"
              : "crashed";
          current.error =
            code === 0
              ? null
              : `Process exited with code ${code}`;

          projects.delete(projectId);
        }

        unwatchProject(projectId);
      });

      const ready =
        await waitForServer(port);

      if (!ready) {
        try {
          proc.kill("SIGTERM");
        } catch {
          // ignore cleanup errors
        }

        projects.delete(projectId);
        unwatchProject(projectId);

        throw new Error(
          `Preview failed on ${port}`,
        );
      }

      record.ready = true;
      record.status = "running";
      record.readyAt = Date.now();
      record.bootDuration =
        record.readyAt -
        record.startedAt;

      watchProject(
        projectId,
        projectPath,
      );

      console.log(
        `[preview-manager] ready ${projectId} on ${port}`,
      );

      return record;
    })();

  starting.set(
    projectId,
    startPromise,
  );

  try {
    return await startPromise;
  } finally {
    starting.delete(projectId);
  }
}

function getProject(projectId) {
  const record =
    projects.get(projectId);

  if (!record) {
    return null;
  }

  if (
    !isProcessAlive(record.process)
  ) {
    projects.delete(projectId);
    unwatchProject(projectId);

    return null;
  }

  return record;
}

function stopProject(projectId) {
  const record =
    projects.get(projectId);

  if (!record) {
    return false;
  }

  try {
    if (
      isProcessAlive(record.process)
    ) {
      record.process.kill("SIGTERM");
    }
  } catch {
    // ignore stop errors
  }

  projects.delete(projectId);
  unwatchProject(projectId);

  return true;
}

module.exports = {
  startProject,
  getProject,
  stopProject,
};
