import path from "node:path";
import chokidar, { type FSWatcher } from "chokidar";

import { publishFileChanged } from "./fsEvents.js";
import { runtimeState } from "./runtimeState.js";

const watchers = new Map<string, FSWatcher>();

function normalizeRelativePath(
  root: string,
  filePath: string,
) {
  return path
    .relative(root, filePath)
    .replace(/\\/g, "/");
}

function shouldIgnore(relativePath: string) {
  return (
    relativePath.startsWith("node_modules/") ||
    relativePath.startsWith(".git/") ||
    relativePath.startsWith("dist/") ||
    relativePath.startsWith(".next/") ||
    relativePath.includes("/node_modules/") ||
    relativePath.endsWith(".tmp")
  );
}

export function watchWorkspace(
  projectId: string,
  projectPath: string,
) {
  if (watchers.has(projectId)) {
    return;
  }

  const watcher = chokidar.watch(projectPath, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 150,
      pollInterval: 50,
    },
    ignored: [
      "**/node_modules/**",
      "**/.git/**",
      "**/dist/**",
      "**/.next/**",
      "**/*.tmp",
    ],
  });

  const publish = (filePath: string) => {
    const relativePath = normalizeRelativePath(projectPath, filePath);

    if (!relativePath || shouldIgnore(relativePath)) {
      return;
    }

    // Publish to event bus for preview refresh
    publishFileChanged({
      projectId,
      file: relativePath,
    });

    // Record in unified state for tracking
    runtimeState.recordPreviewChange(projectId, relativePath, "change");
  };

watcher.on("add", publish);
watcher.on("change", publish);
watcher.on("unlink", publish);

  watcher.on("error", (error) => {
    console.error("[workspace-watcher]", projectId, error);
  });

  watchers.set(projectId, watcher);

  console.log(`[lumina-runtime] watching workspace ${projectId}`);
}

export async function unwatchWorkspace(projectId: string) {
  const watcher = watchers.get(projectId);

  if (!watcher) {
    return;
  }

  watchers.delete(projectId);
  await watcher.close();

  console.log(`[lumina-runtime] stopped watching workspace ${projectId}`);
}

export async function stopAllWorkspaceWatchers() {
  const projectIds = Array.from(watchers.keys());

  await Promise.all(projectIds.map((projectId) => unwatchWorkspace(projectId)));
}

export function getWorkspaceWatcherCount() {
  return watchers.size;
}
