import { useCallback, useEffect, useMemo, useState } from "react";

import { useWorkspace } from "@/context/WorkspaceContext";
import { useRuntimeOperations } from "@/hooks/useRuntimeOperations";
import { repoAuditAccess } from "@/services/repoAuditAccess";
import { listEngagements, type RepairEngagement } from "@/services/repairService";
import { getLatestAudit, type RepositoryAuditReport } from "@/services/repositoryAuditService";
import { deleteRuntimeProject, listRuntimeProjects, type RuntimeProject } from "@/services/runtimeService";
import type { RuntimeState } from "@/services/runtime/types";

/*
 * MS-2026-0011: the Projects dashboard reads only what Runtime knows:
 * each project, where it came from, whether it is running, its latest
 * audit (when the person may audit it) and their open repairs. Nothing is
 * estimated, and a source that cannot be read says so.
 */

export type Loadable<T> = { status: "loading" } | { status: "ok"; data: T } | { status: "error"; message: string };
export type OriginFilter = "all" | "imported" | "built" | "unknown";
export type SortOrder = "recent" | "name";

export interface ProjectRow {
  id: string;
  name: string;
  framework: string | null;
  origin: NonNullable<RuntimeProject["origin"]> | { kind: "unknown"; recorded: false };
  updatedAt: number | null;
  runtime: RuntimeState | null;
  audit: Loadable<RepositoryAuditReport | null> | null;
  openRepairs: number;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));
const OPEN_REPAIR = new Set(["requested", "held", "in_progress", "in_review"]);

export function useProjectsView() {
  const workspace = useWorkspace();
  const runtime = useRuntimeOperations();
  const access = repoAuditAccess();
  const [projects, setProjects] = useState<Loadable<RuntimeProject[]>>({ status: "loading" });
  const [audits, setAudits] = useState<Record<string, Loadable<RepositoryAuditReport | null>>>({});
  const [repairs, setRepairs] = useState<RepairEngagement[]>([]);
  const [round, setRound] = useState(0);
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<OriginFilter>("all");
  const [sort, setSort] = useState<SortOrder>("recent");
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [exporting, setExporting] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const read = () =>
      listRuntimeProjects()
        .then((data) => !cancelled && setProjects({ status: "ok", data }))
        .catch((error) => !cancelled && setProjects((current) => (current.status === "ok" ? current : { status: "error", message: message(error) })));
    void read();
    const timer = window.setInterval(read, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [round]);

  const auditable = useCallback(
    (project: RuntimeProject) => access === "engineer" || (access === "diagnosis" && (project.origin?.kind === "git" || project.origin?.kind === "archive")),
    [access],
  );

  const ids = projects.status === "ok" ? projects.data.filter(auditable).map((project) => project.projectId).join("|") : "";
  useEffect(() => {
    if (!ids) return;
    let cancelled = false;
    for (const id of ids.split("|")) {
      getLatestAudit(id)
        .then((latest) => !cancelled && setAudits((current) => ({ ...current, [id]: { status: "ok", data: latest.report } })))
        .catch((error) => !cancelled && setAudits((current) => ({ ...current, [id]: { status: "error", message: message(error) } })));
    }
    return () => {
      cancelled = true;
    };
  }, [ids, round]);

  useEffect(() => {
    if (access !== "diagnosis") return;
    let cancelled = false;
    listEngagements()
      .then((list) => !cancelled && setRepairs(list))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [access, round]);

  const rows: ProjectRow[] = useMemo(() => {
    const list = projects.status === "ok" ? projects.data : [];
    const states = new Map((runtime.snapshot?.projects ?? []).map((project) => [project.id, project.state]));
    return list.map((project) => ({
      id: project.projectId,
      name: project.repoName ?? project.projectId,
      framework: project.framework && project.framework !== "unknown" ? project.framework : null,
      origin: project.origin ?? { kind: "unknown", recorded: false },
      updatedAt: project.updatedAt ?? null,
      runtime: states.get(project.projectId) ?? null,
      audit: auditable(project) ? audits[project.projectId] ?? { status: "loading" } : null,
      openRepairs: repairs.filter((engagement) => engagement.projectId === project.projectId && OPEN_REPAIR.has(engagement.status)).length,
    }));
  }, [projects, runtime.snapshot, audits, repairs, auditable]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows
      .filter((row) => !needle || row.name.toLowerCase().includes(needle) || row.id.toLowerCase().includes(needle) || (row.framework ?? "").toLowerCase().includes(needle))
      .filter((row) =>
        origin === "all" ? true : origin === "imported" ? row.origin.kind === "git" || row.origin.kind === "archive" : origin === "built" ? row.origin.kind === "built" : row.origin.kind === "unknown",
      )
      .sort((left, right) => (sort === "name" ? left.name.localeCompare(right.name) : (right.updatedAt ?? 0) - (left.updatedAt ?? 0) || left.name.localeCompare(right.name)));
  }, [rows, query, origin, sort]);

  const open = (id: string) => {
    const project = workspace.projects.find((entry) => entry.id === id);
    if (project) workspace.setActiveProject(project);
    workspace.setView("workspace");
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await deleteRuntimeProject(deleting.id);
      setDeleting(null);
      setRound((value) => value + 1);
    } catch (error) {
      setDeleteError(message(error));
    }
  };

  return {
    access,
    projects,
    runtime,
    rows,
    shown,
    query,
    setQuery,
    origin,
    setOrigin,
    sort,
    setSort,
    open,
    deleting,
    setDeleting,
    exporting,
    setExporting,
    deleteError,
    confirmDelete,
    reload: () => setRound((value) => value + 1),
    workspace,
  };
}

export type ProjectsView = ReturnType<typeof useProjectsView>;
