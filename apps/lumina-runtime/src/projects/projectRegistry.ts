import fs from "node:fs";
import path from "node:path";

export interface ProjectRegistryEntry {
  projectId: string;
  ownerId?: string;
  teamId?: string;
  createdBy?: string;
  visibility?: "private" | "team" | "support";
  createdAt: number;
  updatedAt: number;
}

function registryPath() {
  return path.resolve(
    process.cwd(),
    "runtime-data",
    "project-registry.json",
  );
}

function ensureRegistryFile() {
  const file = registryPath();

  fs.mkdirSync(
    path.dirname(file),
    { recursive: true },
  );

  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      "[]",
      "utf8",
    );
  }

  return file;
}

export function loadProjectRegistry(): ProjectRegistryEntry[] {
  const file = ensureRegistryFile();

  try {
    return JSON.parse(
      fs.readFileSync(file, "utf8"),
    );
  } catch {
    return [];
  }
}

export function saveProjectRegistry(
  entries: ProjectRegistryEntry[],
) {
  fs.writeFileSync(
    ensureRegistryFile(),
    JSON.stringify(
      entries,
      null,
      2,
    ),
    "utf8",
  );
}

export function getProjectRegistryEntry(
  projectId: string,
) {
  return loadProjectRegistry().find(
    (entry) =>
      entry.projectId === projectId,
  );
}

export function upsertProjectRegistryEntry(
  entry: Omit<
    ProjectRegistryEntry,
    "createdAt" | "updatedAt"
  >,
) {
  const list =
    loadProjectRegistry();

  const now =
    Date.now();

  const index =
    list.findIndex(
      (item) =>
        item.projectId ===
        entry.projectId,
    );

  if (index >= 0) {
    list[index] = {
      ...list[index],
      ...entry,
      updatedAt: now,
    };
  } else {
    list.push({
      ...entry,
      createdAt: now,
      updatedAt: now,
    });
  }

  saveProjectRegistry(list);
}
