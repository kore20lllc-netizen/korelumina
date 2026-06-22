import fs from "node:fs";
import path from "node:path";

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

  createdAt: number;
  updatedAt: number;
}

function findRuntimeDataRoot() {
  let current = process.cwd();

  for (let i = 0; i < 8; i++) {
    const candidate = path.join(
      current,
      "runtime-data",
    );

    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);

    if (parent === current) {
      break;
    }

    current = parent;
  }

  return path.resolve(
    process.cwd(),
    "runtime-data",
  );
}

const DATA_ROOT =
  findRuntimeDataRoot();

const METADATA_FILE =
  path.join(
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
    updatedAt:
      now,
  };

  store[input.projectId] =
    record;

  writeStore(store);

  return record;
}

export function listProjectMetadata(): ProjectMetadata[] {
  return Object.values(
    readStore(),
  );
}
