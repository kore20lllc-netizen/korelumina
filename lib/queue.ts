import fs from "fs";
import path from "path";

type RunningState = {
  projectId: string;
  pid: number;
  startedAt: number;
};

type QueueItem = {
  projectId: string;
  enqueuedAt: number;
};

type QueueState = {
  running: RunningState | null;
  items: QueueItem[];
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readQueue(queuePath: string): QueueState {
  try {
    const raw = fs.readFileSync(queuePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return { running: null, items: [] };
  }
}

function writeQueue(queuePath: string, state: QueueState) {
  ensureDir(path.dirname(queuePath));
  fs.writeFileSync(queuePath, JSON.stringify(state, null, 2), "utf8");
}

export function enqueue(queuePath: string, projectId: string) {
  const state = readQueue(queuePath);

  if (state.running?.projectId === projectId) {
    return { status: "already-running" };
  }

  if (state.items.find(i => i.projectId === projectId)) {
    return { status: "already-queued" };
  }

  state.items.push({
    projectId,
    enqueuedAt: Date.now()
  });

  writeQueue(queuePath, state);

  return {
    status: "queued",
    position: state.items.length
  };
}

export function startNext(queuePath: string): RunningState | null {
  const state = readQueue(queuePath);

  if (state.running) return null;
  if (state.items.length === 0) return null;

  const next = state.items.shift()!;

  const running: RunningState = {
    projectId: next.projectId,
    pid: process.pid,
    startedAt: Date.now()
  };

  state.running = running;

  writeQueue(queuePath, state);

  return running;
}

export function finish(queuePath: string, projectId: string) {
  const state = readQueue(queuePath);

  if (state.running?.projectId === projectId) {
    state.running = null;
    writeQueue(queuePath, state);
  }
}

export function getQueue(queuePath: string) {
  return readQueue(queuePath);
}
