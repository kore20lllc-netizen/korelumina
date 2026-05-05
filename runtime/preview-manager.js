const { spawn } = require("child_process");
const net = require("net");

const projects = new Map();
const BASE_PORT = 3001;

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
      })
      .connect(port, "127.0.0.1");
  });
}

async function findAvailablePort(start = BASE_PORT) {
  let port = start;
  while (await isPortOpen(port)) {
    port++;
  }
  return port;
}

function isProcessAlive(proc) {
  return proc && !proc.killed;
}

async function waitForServer(port, retries = 20) {
  for (let i = 0; i < retries; i++) {
    if (await isPortOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function startProject(projectId, projectPath) {
  // ✅ 1. reuse existing project
  const existing = projects.get(projectId);
  if (existing && existing.ready && isProcessAlive(existing.process)) {
    return existing;
  }

  // ✅ 2. detect already-running dev server (manual or previous run)
  for (let port = BASE_PORT; port < BASE_PORT + 10; port++) {
    if (await isPortOpen(port)) {
      console.log(`[preview-manager] reusing existing server on ${port}`);
      const record = {
        projectId,
        port,
        process: null,
        ready: true,
      };
      projects.set(projectId, record);
      return record;
    }
  }

  // ✅ 3. find clean port
  const port = await findAvailablePort();

  console.log(`[preview-manager] starting ${projectId} on ${port}...`);

  const proc = spawn("npm", ["run", "dev", "--", "-p", String(port)], {
    cwd: projectPath,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PORT: String(port),
    },
  });

  const record = {
    projectId,
    port,
    process: proc,
    ready: false,
  };

  projects.set(projectId, record);

  proc.on("exit", (code) => {
    const current = projects.get(projectId);
    if (current?.process === proc) {
      projects.delete(projectId);
    }
    console.log(`[preview-manager] ${projectId} stopped (code=${code})`);
  });

  const ready = await waitForServer(port);

  if (!ready) {
    if (isProcessAlive(proc)) proc.kill("SIGTERM");
    projects.delete(projectId);
    throw new Error(`Preview failed on ${port}`);
  }

  record.ready = true;

  console.log(`[preview-manager] ready ${projectId} on ${port}`);

  return record;
}

function getProject(projectId) {
  return projects.get(projectId);
}

module.exports = {
  startProject,
  getProject,
};
