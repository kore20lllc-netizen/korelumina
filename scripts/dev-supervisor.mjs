import { spawn } from "node:child_process";

/*
 * Each child runs in its own process group (detached), so stopping it
 * stops everything it started. npm, tsx watch and node otherwise survive
 * Ctrl+C, and an old Runtime keeps port 4100 with its old environment.
 */

const children = [];
let shuttingDown = false;

function run(name, command, args, cwd = process.cwd()) {
  const child = spawn(command, args, {
    cwd,
    shell: true,
    stdio: "inherit",
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      FORCE_COLOR: "1",
    },
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[dev-supervisor] ${name} stopped by ${signal}`);
    } else {
      console.log(`[dev-supervisor] ${name} exited with code ${code}`);
    }

    if (!shuttingDown) {
      process.exitCode = code ?? 1;
    }
  });

  return child;
}

function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  /* Signal each child's whole process group; true if any is still alive. */
  const signalAll = (signal) => {
    let alive = false;
    for (const child of children) {
      try {
        if (process.platform === "win32") child.kill(signal);
        else process.kill(-child.pid, signal);
        alive = true;
      } catch {
        /* that group is gone */
      }
    }
    return alive;
  };

  signalAll("SIGTERM");
  const startedAt = Date.now();
  const timer = setInterval(() => {
    if (!signalAll(0)) {
      clearInterval(timer);
      process.exit(0);
    }
    if (Date.now() - startedAt > 5000) {
      signalAll("SIGKILL");
      clearInterval(timer);
      process.exit(0);
    }
  }, 100);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

run("runtime", "npm", ["--workspace", "apps/lumina-runtime", "run", "dev"]);
run("builder", "npm", ["--workspace", "apps/lumina-builder", "run", "dev"]);
