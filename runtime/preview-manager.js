const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const {
  watchProject,
  unwatchProject,
} = require("./preview-events");

const projects = new Map();
const starting = new Map();

const BASE_PORT = 3001;

function sleep(ms) {
  return new Promise((r) =>
    setTimeout(r, ms),
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
  retries = 50,
) {
  for (
    let i = 0;
    i < retries;
    i++
  ) {
    const ready =
      await isPortOpen(port);

    if (ready) {
      return true;
    }

    await sleep(300);
  }

  return false;
}

async function killExistingNextDev(
  projectPath,
) {
  const fs = require("fs");

  const logPath = path.join(
    projectPath,
    ".next/dev/logs/next-development.log",
  );

  if (!fs.existsSync(logPath)) {
    return;
  }

  try {
    const text =
      fs.readFileSync(
        logPath,
        "utf8",
      );

    const pidMatch =
      text.match(/"pid":\s*(\d+)/);

    if (!pidMatch) {
      return;
    }

    const pid = Number(
      pidMatch[1],
    );

    if (!pid) {
      return;
    }

    try {
      process.kill(pid, 0);

      console.log(
        `[preview-manager] killing stale next dev pid=${pid}`,
      );

      process.kill(
        pid,
        "SIGTERM",
      );

      await sleep(1200);
    } catch {
      // already dead
    }
  } catch (err) {
    console.error(
      "[preview-manager] failed reading next log",
      err,
    );
  }
}

async function startProject(
  projectId,
  projectPath,
) {
  const existing =
    projects.get(projectId);

  // critical:
  // NEVER spawn another preview
  // if one already exists
  if (
    existing &&
    isProcessAlive(
      existing.process,
    )
  ) {
    return existing;
  }

  // critical:
  // if already starting,
  // reuse same promise
  if (starting.has(projectId)) {
    return starting.get(
      projectId,
    );
  }

  const startPromise =
    (async () => {
      // hard cleanup of stale next dev
      await killExistingNextDev(
        projectPath,
      );

      const port = BASE_PORT;

      console.log(
        `[preview-manager] starting ${projectId} on ${port}...`,
      );

      const proc = spawn(
        "npm",
        [
          "run",
          "dev",
          "--",
          "--webpack",
          "-p",
          String(port),
        ],
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

            unwatchProject(
              projectId,
            );
          }

          console.log(
            `[preview-manager] ${projectId} stopped (code=${code})`,
          );
        },
      );

      const ready =
        await waitForServer(
          port,
        );

      if (!ready) {
        if (
          isProcessAlive(proc)
        ) {
          proc.kill(
            "SIGTERM",
          );
        }

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

  if (
    isProcessAlive(
      record.process,
    )
  ) {
    record.process.kill(
      "SIGTERM",
    );
  }

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
