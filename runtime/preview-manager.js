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

/**
 * Persist state across Next.js hot reloads.
 */
const globalState =
  global.__KORELUMINA_PREVIEW_STATE__ ||
  (global.__KORELUMINA_PREVIEW_STATE__ = {
    projects: new Map(),
    starting: new Map(),
    projectLocks: new Set(),
  });

const projects = globalState.projects;
const starting = globalState.starting;
const projectLocks = globalState.projectLocks;

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

    socket.connect(port, "127.0.0.1");
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
    port += 1;
  }

  return port;
}

function normalizeCommand(command) {
  if (
    !command ||
    typeof command !== "string"
  ) {
    throw new Error(
      "Missing runtime command",
    );
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
    isProcessAlive(
      existing.process,
    )
  ) {
    const alive =
      await isPortOpen(
        existing.port,
      );

    if (alive) {
      return existing;
    }

    try {
      existing.process.kill(
        "SIGTERM",
      );
    } catch {
      // ignore stale process cleanup errors
    }

    projects.delete(projectId);
    unwatchProject(projectId);
  }

  if (starting.has(projectId)) {
    return starting.get(projectId);
  }

  if (projectLocks.has(projectId)) {
    await sleep(1500);

    const locked =
      projects.get(projectId);

    if (
      locked &&
      isProcessAlive(
        locked.process,
      )
    ) {
      return locked;
    }
  }

  projectLocks.add(projectId);

  const startPromise =
    (async () => {
      const projectPath =
        getProjectPath(projectId);

      const projectInfo =
        detectProject(
          projectPath,
        );

      await installDependencies({
        projectId,
        projectPath,
        packageManager:
          projectInfo.packageManager,
      });

      const framework =
        projectInfo.framework;

      const port =
        await findAvailablePort();

      console.log(
        `[preview-manager] framework=${framework}`,
      );

      console.log(
        `[preview-manager] starting ${projectId} on ${port}`,
      );

      const rawCommand =
        normalizeCommand(
          projectInfo.devCommand,
        ).replace(
          "{PORT}",
          String(port),
        );

      console.log(
        `[preview-manager] command=${rawCommand}`,
      );

      const proc = spawn(
        rawCommand,
        {
          cwd: projectPath,
          stdio: "inherit",
          shell: true,
          env: {
            ...process.env,
            PORT: String(port),
            FORCE_COLOR: "1",
          },
        },
      );

      const record = {
        projectId,
        projectPath,
        framework,
        port,
        process: proc,
        ready: false,
        startedAt:
          Date.now(),
      };

      projects.set(
        projectId,
        record,
      );

      proc.on(
        "exit",
        (code) => {
          console.log(
            `[preview-manager] ${projectId} stopped (${code})`,
          );

          const current =
            projects.get(
              projectId,
            );

          if (
            current &&
            current.process === proc
          ) {
            projects.delete(
              projectId,
            );
          }

          unwatchProject(
            projectId,
          );
        },
      );

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
    projectLocks.delete(projectId);
  }
}

function getProject(projectId) {
  const record =
    projects.get(projectId);

  if (!record) {
    return null;
  }

  if (
    !isProcessAlive(
      record.process,
    )
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
      isProcessAlive(
        record.process,
      )
    ) {
      record.process.kill(
        "SIGTERM",
      );
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
