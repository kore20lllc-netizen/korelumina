const fs = require("fs");
const path = require("path");

const clients = new Map(); // projectId -> Set<controller>
const watchers = new Map(); // projectId -> fs.FSWatcher

function shouldIgnore(filePath) {
  if (!filePath) return false;

  const normalized = String(filePath).replaceAll("\\", "/");

  return (
    normalized.includes("node_modules/") ||
    normalized.includes(".next/") ||
    normalized.includes(".git/") ||
    normalized.includes("dist/") ||
    normalized.includes("build/") ||
    normalized.includes(".turbo/")
  );
}

function emit(projectId, payload) {
  const set = clients.get(projectId);
  if (!set || set.size === 0) return;

  const message = `event: preview-refresh\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const controller of set) {
    try {
      controller.enqueue(message);
    } catch {
      set.delete(controller);
    }
  }
}

function subscribe(projectId, controller) {
  if (!clients.has(projectId)) {
    clients.set(projectId, new Set());
  }

  clients.get(projectId).add(controller);

  controller.enqueue(`event: connected\ndata: ${JSON.stringify({ ok: true, projectId })}\n\n`);

  return () => {
    const set = clients.get(projectId);
    if (!set) return;

    set.delete(controller);

    if (set.size === 0) {
      clients.delete(projectId);
    }
  };
}

function watchProject(projectId, projectPath) {
  if (watchers.has(projectId)) return;

  if (!projectPath || !fs.existsSync(projectPath)) {
    console.warn(`[preview-events] cannot watch missing project path: ${projectPath}`);
    return;
  }

  try {
    const watcher = fs.watch(
      projectPath,
      { recursive: true },
      (eventType, filename) => {
        if (!filename || shouldIgnore(filename)) return;

        emit(projectId, {
          projectId,
          eventType,
          file: String(filename),
          ts: Date.now(),
        });
      }
    );

    watcher.on("error", (err) => {
      console.error(`[preview-events] watcher error for ${projectId}`, err);
      watchers.delete(projectId);
    });

    watchers.set(projectId, watcher);

    console.log(`[preview-events] watching ${projectId} at ${projectPath}`);
  } catch (err) {
    console.error(`[preview-events] failed to watch ${projectId}`, err);
  }
}

function unwatchProject(projectId) {
  const watcher = watchers.get(projectId);
  if (!watcher) return;

  watcher.close();
  watchers.delete(projectId);
}

module.exports = {
  emit,
  subscribe,
  watchProject,
  unwatchProject,
};
