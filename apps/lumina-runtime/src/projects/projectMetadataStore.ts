import fs from "node:fs";
import path from "node:path";

import { getRuntimeDataRoot } from "./workspacePaths.js";

/*
 * MS-2026-0013: where a project came from. Set by Runtime when it imports
 * or creates the project, never by the browser. Diagnosis and paid repair
 * are offered only for imported projects.
 */
export type ProjectOrigin =
  | { kind: "git"; provider: string; host: string; source: string; importedAt: number }
  | { kind: "archive"; source: string; importedAt: number }
  | { kind: "built"; createdAt: number };

export interface ProjectMetadata {
  projectId: string;
  ownerId?: string;
  teamId?: string;
  createdBy?: string;
  visibility?: "private" | "team" | "support";

  framework?: string;

  sourceUrl?: string;
  repoOwner?: string;
  repoName?: string;

  origin?: ProjectOrigin;

  createdAt: number;
  updatedAt: number;
}

const DATA_ROOT =
  getRuntimeDataRoot();

const METADATA_FILE = path.join(
  DATA_ROOT,
  "project-metadata.json",
);

function ensureStore() {
  fs.mkdirSync(
    DATA_ROOT,
    { recursive: true },
  );

  if (!fs.existsSync(METADATA_FILE)) {
    fs.writeFileSync(
      METADATA_FILE,
      "{}",
      "utf8",
    );
  }
}

function readStore(): Record<string, ProjectMetadata> {
  ensureStore();

  try {
    return JSON.parse(
      fs.readFileSync(
        METADATA_FILE,
        "utf8",
      ),
    );
  } catch {
    return {};
  }
}

function writeStore(
  store: Record<string, ProjectMetadata>,
) {
  ensureStore();

  fs.writeFileSync(
    METADATA_FILE,
    JSON.stringify(
      store,
      null,
      2,
    ),
    "utf8",
  );
}

export function getProjectMetadata(
  projectId: string,
): ProjectMetadata | null {
  const store =
    readStore();

  return (
    store[projectId] ??
    null
  );
}

export function setProjectMetadata(
  input: Omit<
    ProjectMetadata,
    "createdAt" | "updatedAt"
  >,
): ProjectMetadata {
  const store =
    readStore();

  const existing =
    store[input.projectId];

  const now =
    Date.now();

  const record: ProjectMetadata = {
    ...existing,
    ...input,
    createdAt:
      existing?.createdAt ??
      now,
    updatedAt: now,
  };

  store[input.projectId] =
    record;

  writeStore(store);

  return record;
}

export function removeProjectMetadata(
  projectId: string,
) {
  const store =
    readStore();

  if (!store[projectId]) {
    return;
  }

  delete store[projectId];

  writeStore(store);
}
