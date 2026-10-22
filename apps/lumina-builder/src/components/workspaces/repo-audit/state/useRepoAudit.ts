import { useCallback, useEffect, useRef, useState } from "react";

import {
  followAudit,
  getFixPlan,
  getLatestAudit,
  listAuditReports,
  startAudit,
  type AuditFixStep,
  type AuditMode,
  type AuditProgress,
  type AuditStage,
  type RepositoryAuditReport,
  type ReportSummary,
} from "@/services/repositoryAuditService";
import { listRuntimeProjects, type RuntimeProject } from "@/services/runtimeService";

/*
 * MS-2026-0012: Repo Audit state, read only from Runtime. Every value is
 * either loaded, loading, or failed with the reason; nothing falls back to
 * sample data.
 */

export type Loadable<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error"; message: string };

export const STAGE_ORDER: readonly AuditStage[] = [
  "snapshot",
  "inventory",
  "dependencies",
  "secrets",
  "code",
  "environment",
  "architecture",
  "advisories",
  "build",
  "report",
];

export interface RunningAudit {
  runId: string;
  mode: AuditMode;
  stages: Partial<Record<AuditStage, AuditProgress>>;
  error: string | null;
}

export interface RepoAuditState {
  projects: Loadable<RuntimeProject[]>;
  projectId: string | null;
  selectProject(projectId: string): void;
  report: Loadable<RepositoryAuditReport | null>;
  history: Loadable<ReportSummary[]>;
  fixPlan: Loadable<AuditFixStep[]>;
  running: RunningAudit | null;
  run(mode: AuditMode): void;
  /* The last error from starting or following an audit. */
  runError: string | null;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));
const STORAGE_KEY = "korelumina.repoAudit.projectId";

function rememberedProject(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useRepoAudit(): RepoAuditState {
  const [projects, setProjects] = useState<Loadable<RuntimeProject[]>>({ status: "loading" });
  const [projectId, setProjectId] = useState<string | null>(rememberedProject);
  const [report, setReport] = useState<Loadable<RepositoryAuditReport | null>>({ status: "loading" });
  const [history, setHistory] = useState<Loadable<ReportSummary[]>>({ status: "loading" });
  const [fixPlan, setFixPlan] = useState<Loadable<AuditFixStep[]>>({ status: "loading" });
  const [running, setRunning] = useState<RunningAudit | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const follow = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    listRuntimeProjects()
      .then((list) => {
        if (cancelled) return;
        const sorted = [...list].sort((left, right) => left.projectId.localeCompare(right.projectId));
        setProjects({ status: "ok", data: sorted });
        setProjectId((current) => (current && sorted.some((project) => project.projectId === current) ? current : sorted[0]?.projectId ?? null));
      })
      .catch((error) => !cancelled && setProjects({ status: "error", message: message(error) }));
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async (id: string) => {
    setReport({ status: "loading" });
    setHistory({ status: "loading" });
    setFixPlan({ status: "loading" });
    let latest: Awaited<ReturnType<typeof getLatestAudit>>;
    try {
      latest = await getLatestAudit(id);
      setReport({ status: "ok", data: latest.report });
    } catch (error) {
      setReport({ status: "error", message: message(error) });
      setHistory({ status: "error", message: message(error) });
      setFixPlan({ status: "error", message: message(error) });
      return null;
    }
    listAuditReports(id)
      .then((reports) => setHistory({ status: "ok", data: reports }))
      .catch((error) => setHistory({ status: "error", message: message(error) }));
    if (latest.report) {
      getFixPlan(id, latest.report.reportId)
        .then((steps) => setFixPlan({ status: "ok", data: steps }))
        .catch((error) => setFixPlan({ status: "error", message: message(error) }));
    } else {
      setFixPlan({ status: "ok", data: [] });
    }
    return latest.runningRunId;
  }, []);

  const watch = useCallback(
    (id: string, runId: string, mode: AuditMode) => {
      follow.current?.abort();
      const controller = new AbortController();
      follow.current = controller;
      setRunError(null);
      setRunning({ runId, mode, stages: {}, error: null });
      followAudit(
        runId,
        (event) => {
          if (event.type === "progress" && event.progress) {
            const progress = event.progress;
            setRunning((current) => (current && current.runId === runId ? { ...current, stages: { ...current.stages, [progress.stage]: progress } } : current));
          }
        },
        controller.signal,
      )
        .then((last) => {
          if (controller.signal.aborted) return;
          setRunning(null);
          if (last.type === "failed") setRunError(last.error ?? "The audit failed.");
          void load(id);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setRunning(null);
          setRunError(message(error));
        });
    },
    [load],
  );

  useEffect(() => {
    if (!projectId) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, projectId);
    } catch {
      /* Remembering the project is a convenience only. */
    }
    follow.current?.abort();
    setRunning(null);
    setRunError(null);
    let cancelled = false;
    void load(projectId).then((runningRunId) => {
      if (!cancelled && runningRunId) watch(projectId, runningRunId, "scan");
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, load, watch]);

  useEffect(() => () => follow.current?.abort(), []);

  const run = useCallback(
    (mode: AuditMode) => {
      if (!projectId || running) return;
      setRunError(null);
      startAudit(projectId, mode)
        .then((runId) => watch(projectId, runId, mode))
        .catch((error) => setRunError(message(error)));
    },
    [projectId, running, watch],
  );

  return { projects, projectId, selectProject: setProjectId, report, history, fixPlan, running, run, runError };
}
