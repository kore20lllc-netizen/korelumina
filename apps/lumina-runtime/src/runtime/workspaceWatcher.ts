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
  const normalized =
    relativePath
      .replace(/\\/g, "/")
      .replace(/^\.\//, "");

  return (
    normalized === "node_modules" ||
    normalized.startsWith("node_modules/") ||
    normalized.includes("/node_modules/") ||
    normalized === ".git" ||
    normalized.startsWith(".git/") ||
    normalized.includes("/.git/") ||
    normalized === "dist" ||
    normalized.startsWith("dist/") ||
    normalized.includes("/dist/") ||
    normalized === "build" ||
    normalized.startsWith("build/") ||
    normalized.includes("/build/") ||
    normalized === ".next" ||
    normalized.startsWith(".next/") ||
    normalized.includes("/.next/") ||
    normalized === ".turbo" ||
    normalized.startsWith(".turbo/") ||
    normalized.includes("/.turbo/") ||
    normalized === "coverage" ||
    normalized.startsWith("coverage/") ||
    normalized.includes("/coverage/") ||
    normalized.endsWith(".tmp") ||
    normalized.endsWith(".log")
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
    followSymlinks: false,
    depth: 20,
    awaitWriteFinish: {
      stabilityThreshold: 150,
      pollInterval: 50,
    },
    ignored: (filePath: string) => {
      const relativePath =
        normalizeRelativePath(projectPath, filePath);

      return shouldIgnore(relativePath);
    },
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
