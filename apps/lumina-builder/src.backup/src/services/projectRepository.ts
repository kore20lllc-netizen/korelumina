import { AppError } from "@/lib/errors";
import { readJSON, writeJSON, subscribe, uid, registerMigration } from "@/lib/persistence";
import type { Project } from "@/context/WorkspaceContext";

const NS = "projects";

export interface StoredProject extends Project {
  description?: string;
  files?: Record<string, string>;
  settings?: Record<string, unknown>;
  previewUrl?: string;
  ownerId?: string;
  /** Team workspace this project belongs to. Always set on newly-created
   *  projects; legacy demo seeds without a team are assigned to a fallback
   *  team by the boot migration in src/lib/seed.ts. */
  teamId?: string;
  /** User id of whoever created this project. Independent of `ownerId`
   *  (legacy single-tenant owner) so audit/attribution survives team changes. */
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
}

function all(): StoredProject[] { return readJSON<StoredProject[]>(NS, "all", []); }
function persist(p: StoredProject[]) { writeJSON(NS, "all", p); }

function touch(p: StoredProject): StoredProject {
  return { ...p, updatedAt: Date.now(), lastEditedAt: Date.now() };
}

export const projectRepository = {
  list(scope?: { teamId?: string; ownerId?: string }): StoredProject[] {
    const list = all();
    if (!scope) return list;
    if (scope.teamId) {
      return list.filter((p) => p.teamId === scope.teamId);
    }
    if (scope.ownerId) {
      return list.filter((p) => !p.ownerId || p.ownerId === scope.ownerId);
    }
    return list;
  },
  get(id: string): StoredProject | null {
    return all().find((p) => p.id === id) ?? null;
  },
  create(
    input: Partial<StoredProject> & { name: string; type: Project["type"] },
    scope?: { ownerId?: string; teamId?: string; createdBy?: string },
  ): StoredProject {
    const now = Date.now();
    const p: StoredProject = {
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
      ownerId: scope?.ownerId ?? input.ownerId,
      teamId: scope?.teamId ?? input.teamId,
      createdBy: scope?.createdBy ?? input.createdBy ?? scope?.ownerId ?? input.ownerId,
      createdAt: now,
      updatedAt: now,
    };
    persist([p, ...all()]);
    return p;
  },
  update(id: string, patch: Partial<StoredProject>): StoredProject {
    const list = all();
    const i = list.findIndex((p) => p.id === id);
    if (i < 0) throw new AppError("NOT_FOUND", "Project not found.");
    list[i] = touch({ ...list[i], ...patch });
    persist(list);
    return list[i];
  },
  remove(id: string): void {
    persist(all().filter((p) => p.id !== id));
  },
  duplicate(id: string): StoredProject {
    const src = this.get(id);
    if (!src) throw new AppError("NOT_FOUND", "Project not found.");
    return this.create(
      { ...src, id: undefined, name: `${src.name} (copy)`, status: "draft" },
      { ownerId: src.ownerId, teamId: src.teamId },
    );
  },
  /** Move every project missing a teamId onto the given team. Idempotent. */
  assignOrphansToTeam(teamId: string): void {
    const list = all();
    let touched = false;
    for (let i = 0; i < list.length; i++) {
      if (!list[i].teamId) { list[i] = { ...list[i], teamId }; touched = true; }
    }
    if (touched) persist(list);
  },
  saveFiles(id: string, files: Record<string, string>) { return this.update(id, { files }); },
  onChange(cb: () => void) { return subscribe(NS, cb); },
};

// Schema migration: bump the project namespace version so callers can detect
// the new teamId field. Actual orphan reassignment happens in
// ActiveTeamContext once the demo team exists.
registerMigration("projects", 2, () => {
  /* no-op — kept for schema versioning */
});