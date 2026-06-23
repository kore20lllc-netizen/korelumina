import fs from "node:fs";
import path from "node:path";

import type { RuntimeStatus } from "./registry.js";

const DATA_DIR = path.resolve(
  process.cwd(),
  "runtime-data",
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

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, {
    recursive: true,
  });
}

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

  const filePath = runtimeStatePath(runtime.projectId);
  const tmpPath = `${filePath}.tmp`;

  fs.writeFileSync(
    tmpPath,
    JSON.stringify(runtime, null, 2),
    "utf8",
  );

  fs.renameSync(tmpPath, filePath);
}

export function removeRuntimeState(projectId: string) {
  const filePath = runtimeStatePath(projectId);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function listPersistedRuntimes(): PersistedRuntime[] {
  ensureDataDir();

  return fs
    .readdirSync(DATA_DIR)
    .filter(
      (file) =>
        file.endsWith(".json") &&
        file !== "project-metadata.json" &&
        file !== "project-registry.json",
    )
    .flatMap((file) => {
      const filePath = path.join(DATA_DIR, file);

      try {
        const parsed = JSON.parse(
          fs.readFileSync(filePath, "utf8"),
        ) as PersistedRuntime;

        if (!parsed.projectId || !parsed.url || !parsed.port) {
          fs.unlinkSync(filePath);
          return [];
        }

        return [parsed];
      } catch {
        fs.unlinkSync(filePath);
        return [];
      }
    });
}
