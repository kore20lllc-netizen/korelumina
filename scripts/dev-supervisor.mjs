import { spawn } from "node:child_process";

const children = [];
let shuttingDown = false;

function run(name, command, args, cwd = process.cwd()) {
  const child = spawn(command, args, {
    cwd,
    shell: true,
    stdio: "inherit",
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

  for (const child of children) {
    if (!child.killed && child.exitCode === null) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(0), 300);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

run("runtime", "npm", ["--workspace", "apps/lumina-runtime", "run", "dev"]);
run("builder", "npm", ["--workspace", "apps/lumina-builder", "run", "dev"]);
