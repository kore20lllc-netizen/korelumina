import { AppError } from "@/lib/errors";
import {
  readJSON,
  writeJSON,
  subscribe,
  uid,
  registerMigration,
} from "@/lib/persistence";
import type { Project } from "@/types/api";

const NS = "projects";

export interface StoredProject extends Project {
  description?: string;
  files?: Record<string, string>;
  settings?: Record<string, unknown>;
  previewUrl?: string;
  framework?: string;
  packageManager?: string;
  entryFile?: string;
  sourceUrl?: string;
  ownerId?: string;
  teamId?: string;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
}

function all(): StoredProject[] {
  return readJSON<StoredProject[]>(NS, "all", []);
}

function persist(projects: StoredProject[]) {
  writeJSON(NS, "all", projects);
}

function touch(project: StoredProject): StoredProject {
  return {
    ...project,
    updatedAt: Date.now(),
    lastEditedAt: Date.now(),
    lastEdited: "Just now",
  };
}

function assertSafeFilePath(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/").trim();

  if (!normalized) {
    throw new AppError("VALIDATION", "Missing file path.");
  }

  if (
    normalized.startsWith("/") ||
    normalized.includes("../") ||
    normalized === ".." ||
    normalized.includes("\0")
  ) {
    throw new AppError("VALIDATION", "Unsafe file path.");
  }

  return normalized;
}

export const projectRepository = {
  list(scope?: { teamId?: string; ownerId?: string }): StoredProject[] {
    const list = all();

    if (!scope) return list;

    if (scope.teamId) {
      return list.filter((project) => project.teamId === scope.teamId);
    }

    if (scope.ownerId) {
      return list.filter(
        (project) => !project.ownerId || project.ownerId === scope.ownerId,
      );
    }

    return list;
  },

  get(id: string): StoredProject | null {
    return all().find((project) => project.id === id) ?? null;
  },

  create(
    input: Partial<StoredProject> & { name: string; type: Project["type"] },
    scope?: { ownerId?: string; teamId?: string; createdBy?: string },
  ): StoredProject {
    const now = Date.now();

    const project: StoredProject = {
      id: input.id ?? uid("prj"),
      name: input.name,
      type: input.type,
      status: input.status ?? "draft",
      accent: input.accent ?? "violet",
      runtime: input.runtime ?? "cold",
      lastEdited: "Just now",
      lastEditedAt: now,
      description: input.description,
      files: input.files ?? {},
      settings: input.settings ?? {},
      previewUrl: input.previewUrl,
      framework: input.framework,
      packageManager: input.packageManager,
      entryFile: input.entryFile,
      sourceUrl: input.sourceUrl,
      ownerId: scope?.ownerId ?? input.ownerId,
      teamId: scope?.teamId ?? input.teamId,
      createdBy:
        scope?.createdBy ??
        input.createdBy ??
        scope?.ownerId ??
        input.ownerId,
      createdAt: now,
      updatedAt: now,
    };

    persist([project, ...all()]);

    return project;
  },

  update(id: string, patch: Partial<StoredProject>): StoredProject {
    const list = all();
    const index = list.findIndex((project) => project.id === id);

    if (index < 0) {
      throw new AppError("NOT_FOUND", "Project not found.");
    }

    list[index] = touch({
      ...list[index],
      ...patch,
    });

    persist(list);

    return list[index];
  },

  remove(id: string): void {
    persist(all().filter((project) => project.id !== id));
  },

  duplicate(id: string): StoredProject {
    const source = this.get(id);

    if (!source) {
      throw new AppError("NOT_FOUND", "Project not found.");
    }

    return this.create(
      {
        ...source,
        id: undefined,
        name: `${source.name} (copy)`,
        status: "draft",
      },
      {
        ownerId: source.ownerId,
        teamId: source.teamId,
      },
    );
  },

  assignOrphansToTeam(teamId: string): void {
    const list = all();
    let changed = false;

    for (let index = 0; index < list.length; index++) {
      if (!list[index].teamId) {
        list[index] = {
          ...list[index],
          teamId,
        };
        changed = true;
      }
    }

    if (changed) {
      persist(list);
    }
  },

  readFile(id: string, filePath: string): string {
    const project = this.get(id);

    if (!project) {
      throw new AppError("NOT_FOUND", "Project not found.");
    }

    const safePath = assertSafeFilePath(filePath);

    return project.files?.[safePath] ?? "";
  },

  writeFile(id: string, filePath: string, content: string): StoredProject {
    const project = this.get(id);

    if (!project) {
      throw new AppError("NOT_FOUND", "Project not found.");
    }

    const safePath = assertSafeFilePath(filePath);

    return this.update(id, {
      files: {
        ...(project.files ?? {}),
        [safePath]: content,
      },
    });
  },

  saveFiles(id: string, files: Record<string, string>): StoredProject {
    const safeFiles: Record<string, string> = {};

    for (const [filePath, content] of Object.entries(files)) {
      safeFiles[assertSafeFilePath(filePath)] = content;
    }

    return this.update(id, {
      files: safeFiles,
    });
  },

  onChange(callback: () => void) {
    return subscribe(NS, callback);
  },
};

registerMigration("projects", 2, () => {
  // no-op — kept for schema versioning
});
