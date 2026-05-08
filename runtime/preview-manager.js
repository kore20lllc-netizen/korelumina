const { spawn } = require("child_process");
const net = require("net");
const path = require("path");
const fs = require("fs");

const {
  watchProject,
  unwatchProject,
} = require("./preview-events");

const projects = new Map();
const starting = new Map();

const BASE_PORT = 3001;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
    const ready =
      await isPortOpen(port);

    if (ready) {
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

function detectFramework(projectPath) {
  const packageJsonPath = path.join(
    projectPath,
    "package.json",
  );

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      "package.json not found",
    );
  }

  const pkg = JSON.parse(
    fs.readFileSync(
      packageJsonPath,
      "utf8",
    ),
  );

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  if (deps.next) {
    return "next";
  }

  if (deps.vite) {
    return "vite";
  }

  throw new Error(
    "Unsupported framework",
  );
}

function buildCommand(
  framework,
  port,
) {
  if (framework === "next") {
    return [
      "run",
      "dev",
      "--",
      "--webpack",
      "-p",
      String(port),
    ];
  }

  if (framework === "vite") {
    return [
      "run",
      "dev",
      "--",
      "--port",
      String(port),
    ];
  }

  throw new Error(
    `Unknown framework ${framework}`,
  );
}

async function startProject(
  projectId,
  projectPath,
) {
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
    } catch {}
  }

  if (starting.has(projectId)) {
    return starting.get(
      projectId,
    );
  }

  const startPromise =
    (async () => {
      const framework =
        detectFramework(
          projectPath,
        );

      const port =
        await findAvailablePort();

      console.log(
        `[preview-manager] framework=${framework}`,
      );

      console.log(
        `[preview-manager] starting ${projectId} on ${port}`,
      );

      const commandArgs =
        buildCommand(
          framework,
          port,
        );

      const proc = spawn(
        "npm",
        commandArgs,
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
            current?.process ===
            proc
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
        await waitForServer(
          port,
        );

      if (!ready) {
        try {
          proc.kill(
            "SIGTERM",
          );
        } catch {}

        projects.delete(
          projectId,
        );

        unwatchProject(
          projectId,
        );

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
    starting.delete(
      projectId,
    );
  }
}

function getProject(
  projectId,
) {
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
    projects.delete(
      projectId,
    );

    unwatchProject(
      projectId,
    );

    return null;
  }

  return record;
}

function stopProject(
  projectId,
) {
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
  } catch {}

  projects.delete(
    projectId,
  );

  unwatchProject(
    projectId,
  );

  return true;
}

module.exports = {
  startProject,
  getProject,
  stopProject,
};
