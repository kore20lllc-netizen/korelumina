import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "runtime", "jobs.json");

type JobRecord = {
  projectId: string;
  running: boolean;
  startedAt?: number;
  finishedAt?: number;
  exitCode?: number;
};

function readStore(): Record<string, JobRecord> {
  if (!fs.existsSync(STORE_PATH)) return {};
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
}

function writeStore(data: Record<string, JobRecord>) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

export function startJob(projectId: string) {
  const store = readStore();
  store[projectId] = {
    projectId,
    running: true,
    startedAt: Date.now()
  };
  writeStore(store);
}

export function finishJob(projectId: string, exitCode: number) {
  const store = readStore();
  if (!store[projectId]) return;

  store[projectId] = {
    ...store[projectId],
    running: false,
    finishedAt: Date.now(),
    exitCode
  };

  writeStore(store);
}

export function getJob(projectId: string) {
  const store = readStore();
  return store[projectId] || {
    projectId,
    running: false
  };
}
