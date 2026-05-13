const { spawn } = require("child_process");
const net = require("net");
const http = require("http");
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

    socket.setTimeout(1000);

    socket
      .once("connect", () => {
        socket.destroy();
        resolve(true);
      })
      .once("timeout", () => {
        socket.destroy();
        resolve(false);
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

function isHttpReady(port) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: "127.0.0.1",
        port,
        path: "/",
        timeout: 2500,
        headers: {
          "User-Agent":
            "KoreLumina-Preview-Healthcheck",
        },
      },
      (res) => {
        res.resume();

        resolve(
          res.statusCode &&
            res.statusCode >= 200 &&
            res.statusCode < 500,
        );
      },
    );

    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.on("error", () => {
      resolve(false);
    });
  });
}

async function waitForServer(
  port,
  retries = 120,
) {
  for (let i = 0; i < retries; i++) {
    const portOpen =
      await isPortOpen(port);

    if (portOpen) {
      const httpReady =
        await isHttpReady(port);

      if (httpReady) {
        return true;
      }
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

function appendLog(record, chunk) {
  if (!record || !chunk) {
    return;
  }

  const text = String(chunk);

  record.logs.push(text);

  if (record.logs.length > 200) {
    record.logs =
      record.logs.slice(-200);
  }
}

async function stopProject(projectId) {
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

      await sleep(700);

      if (
        isProcessAlive(
          record.process,
        )
      ) {
        record.process.kill(
          "SIGKILL",
        );
      }
    }
  } catch {
    // ignore stop errors
  }

  projects.delete(projectId);

  unwatchProject(
    projectId,
  );

  return true;
}

async function startProject(projectId) {
  if (!projectId) {
    throw new Error(
      "Missing projectId",
    );
  }

  const existing =
    projects.get(projectId);

  if (
    existing &&
    isProcessAlive(
      existing.process,
    )
  ) {
    const ready =
      await isHttpReady(
        existing.port,
      );

    if (ready) {
      return existing;
    }

    await stopProject(projectId);
  }

  if (starting.has(projectId)) {
    return starting.get(projectId);
  }

  if (projectLocks.has(projectId)) {
    const activeStart =
      starting.get(projectId);

    if (activeStart) {
      return activeStart;
    }

    await sleep(1000);

    const locked =
      projects.get(projectId);

    if (
      locked &&
      isProcessAlive(
        locked.process,
      ) &&
      (await isHttpReady(locked.port))
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

      const framework =
        projectInfo.framework;

      const port =
        await findAvailablePort();

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
          shell: true,
          env: {
            ...process.env,
            PORT: String(port),
            HOST: "0.0.0.0",
            FORCE_COLOR: "1",
          },
          stdio: [
            "ignore",
            "pipe",
            "pipe",
          ],
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
        readyAt: null,
        pid:
          proc.pid,
        error: null,
        logs: [],
      };

      projects.set(
        projectId,
        record,
      );

      proc.stdout.on(
        "data",
        (chunk) => {
          appendLog(record, chunk);
          process.stdout.write(chunk);
        },
      );

      proc.stderr.on(
        "data",
        (chunk) => {
          appendLog(record, chunk);
          process.stderr.write(chunk);
        },
      );

      proc.on(
        "exit",
        (code) => {
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

          unwatchProject(
            projectId,
          );
        },
      );

      const ready =
        await waitForServer(port);

      if (!ready) {
        record.ready = false;
        record.status = "crashed";
        record.error =
          `Preview failed on ${port}`;

        try {
          proc.kill("SIGTERM");
        } catch {
          // ignore cleanup errors
        }

        await sleep(700);

        try {
          if (isProcessAlive(proc)) {
            proc.kill("SIGKILL");
          }
        } catch {
          // ignore cleanup errors
        }

        projects.delete(projectId);

        unwatchProject(
          projectId,
        );

        throw new Error(
          `Preview failed on ${port}`,
        );
      }

      record.ready = true;
      record.status = "running";
      record.readyAt = Date.now();

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

    unwatchProject(
      projectId,
    );

    return null;
  }

  return record;
}

module.exports = {
  startProject,
  getProject,
  stopProject,
};
