import {
  FileStore,
  JsonStore,
} from "@korelumina/platform-sdk";

import { getRuntimeLockRoot } from "../projects/workspacePaths.js";

const LOCK_DIR =
  getRuntimeLockRoot();

const store =
  new JsonStore(
    new FileStore(LOCK_DIR),
  );

function validateProjectId(projectId: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(projectId)) {
    throw new Error("invalid_projectId");
  }
}

function lockFile(projectId: string) {
  validateProjectId(projectId);

  return `${projectId}.lock`;
}

export function acquireRuntimeLock(
  projectId: string,
  pid: number,
) {
  const file = lockFile(projectId);

  const payload = {
    projectId,
    pid,
    createdAt: Date.now(),
  };

  store.write(
    file,
    payload,
  );
}

export function releaseRuntimeLock(
  projectId: string,
) {
  const file = lockFile(projectId);

  store.remove(file);
}

export function getRuntimeLock(
  projectId: string,
): { pid: number } | null {
  const file = lockFile(projectId);

  try {
    const parsed =
      store.read<{ pid?: unknown }>(file);

    if (!parsed) {
      return null;
    }

    return {
      pid: Number(parsed.pid) || 0,
    };
  } catch {
    store.remove(file);
    return null;
  }
}
