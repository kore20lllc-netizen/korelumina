import path from "node:path";

import { getRuntimeDataRoot } from "../projects/workspacePaths.js";
import type { RuntimeStatus } from "./registry.js";
import {
  FileStore,
  JsonStore,
} from "@korelumina/platform-sdk";

const DATA_DIR =
  getRuntimeDataRoot();

const store =
  new JsonStore(
    new FileStore(DATA_DIR),
  );

export type PersistedRuntime = {
  projectId: string;
  framework: string;
  port: number;
  pid?: number;
  startedAt: number;
  exitedAt?: number;
  lastError?: string;
  url: string;
  status: RuntimeStatus;
};

function ensureDataDir() {}

function safeFileName(projectId: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(projectId)) {
    throw new Error("invalid_projectId");
  }

  return `${projectId}.json`;
}

export function runtimeStatePath(projectId: string) {
  ensureDataDir();

  return path.join(
    DATA_DIR,
    safeFileName(projectId),
  );
}

export function persistRuntimeState(runtime: PersistedRuntime) {
  ensureDataDir();

  store.write(
    safeFileName(runtime.projectId),
    runtime,
  );
}

export function removeRuntimeState(projectId: string) {
  store.remove(
    safeFileName(projectId),
  );
}

export function listPersistedRuntimes(): PersistedRuntime[] {
  ensureDataDir();

  return store
    .list()
    .filter(
      (file) =>
        file.endsWith(".json") &&
        file !== "project-metadata.json" &&
        file != "project-registry.json",
    )
    .flatMap((file) => {
      const parsed =
        store.read<PersistedRuntime>(file);

      if (
        !parsed ||
        !parsed.projectId ||
        !parsed.url ||
        !parsed.port
      ) {
        store.remove(file);
        return [];
      }

      return [parsed];
    });
}
