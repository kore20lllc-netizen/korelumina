import { useCallback, useEffect, useMemo, useState } from "react";

import { useRuntimeOperations } from "@/hooks/useRuntimeOperations";
import { getMissions, type MissionRecord } from "@/services/executiveOfficeService";
import { actOnEngagement, listEngagements, type EngagementAction, type RepairEngagement } from "@/services/repairService";
import { getLatestAudit, type RepositoryAuditReport } from "@/services/repositoryAuditService";
import type { RuntimeProject } from "@/services/runtime/types";

import type { PreviewTone } from "../../executive/design/executiveDesignPreview";
import { isOpenMission } from "../../executive/state/missionView";

/*
 * MS-2026-0011: the In-House Dev console reads three live sources and
 * nothing else: Runtime's projects, each project's latest Repository
 * Intelligence report, and the Executive Office missions. A source that
 * cannot be read says so; nothing is estimated.
 */

export type Loadable<T> = { status: "loading" } | { status: "ok"; data: T } | { status: "error"; message: string };

export interface ProjectAudit {
  report: RepositoryAuditReport | null;
  running: boolean;
}

export interface AttentionItem {
  id: string;
  tone: PreviewTone;
  title: string;
  detail: string;
  target: { view: "repo-audit" | "runtime-operations" | "executive-office" | "engagements"; projectId?: string };
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function useInHouseConsole() {
  const runtime = useRuntimeOperations();
  const projects: RuntimeProject[] = useMemo(
    () => [...(runtime.snapshot?.projects ?? [])].sort((left, right) => left.name.localeCompare(right.name)),
    [runtime.snapshot],
  );
  const ids = projects.map((project) => project.id).join("|");
  const [audits, setAudits] = useState<Record<string, Loadable<ProjectAudit>>>({});
  const [missions, setMissions] = useState<Loadable<MissionRecord[]>>({ status: "loading" });
  const [round, setRound] = useState(0);
  /* MS-2026-0015: the repair queue. */
  const [engagements, setEngagements] = useState<Loadable<RepairEngagement[]>>({ status: "loading" });
  const [acting, setActing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    for (const id of ids ? ids.split("|") : []) {
      setAudits((current) => (current[id] ? current : { ...current, [id]: { status: "loading" } }));
      getLatestAudit(id)
        .then((latest) => {
          if (!cancelled) setAudits((current) => ({ ...current, [id]: { status: "ok", data: { report: latest.report, running: Boolean(latest.runningRunId) } } }));
        })
        .catch((error) => {
          if (!cancelled) setAudits((current) => ({ ...current, [id]: { status: "error", message: message(error) } }));
        });
    }
    return () => {
      cancelled = true;
    };
  }, [ids, round]);

  useEffect(() => {
    let cancelled = false;
    getMissions()
      .then((data) => !cancelled && setMissions({ status: "ok", data }))
      .catch((error) => !cancelled && setMissions({ status: "error", message: message(error) }));
    return () => {
      cancelled = true;
    };
  }, [round]);

  useEffect(() => {
    let cancelled = false;
    listEngagements()
      .then((data) => !cancelled && setEngagements({ status: "ok", data }))
      .catch((error) => !cancelled && setEngagements({ status: "error", message: message(error) }));
    return () => {
      cancelled = true;
    };
  }, [round]);

  const reload = useCallback(() => setRound((value) => value + 1), []);

  const act = useCallback(async (id: string, action: EngagementAction): Promise<boolean> => {
    setActing(id);
    setActionError(null);
    try {
      const updated = await actOnEngagement(id, action);
      setEngagements((current) => (current.status === "ok" ? { status: "ok", data: current.data.map((entry) => (entry.id === id ? updated : entry)) } : current));
      return true;
    } catch (error) {
      setActionError({ id, message: message(error) });
      return false;
    } finally {
      setActing(null);
    }
  }, []);

  const audited = projects.filter((project) => {
    const audit = audits[project.id];
    return audit?.status === "ok" && audit.data.report !== null;
  });
  const reports = audited.map((project) => ({ project, report: (audits[project.id] as { data: ProjectAudit }).data.report! }));
  const lowest = reports
    .filter((entry) => entry.report.summary.score !== null)
    .sort((left, right) => (left.report.summary.score ?? 0) - (right.report.summary.score ?? 0))[0] ?? null;
  const critical = reports.reduce((sum, entry) => sum + entry.report.summary.counts.critical, 0);
  const openMissions = missions.status === "ok" ? missions.data.filter(isOpenMission) : [];
  const awaiting = openMissions.filter((mission) => mission.state === "awaiting_approval");

  const attention: AttentionItem[] = [];
  for (const project of projects) {
    if (project.state === "error") {
      attention.push({
        id: `runtime:${project.id}`,
        tone: "error",
        title: `${project.name} failed in Runtime`,
        detail: project.process?.lastError ?? project.process?.lastFailureReason ?? "Its process stopped with an error.",
        target: { view: "runtime-operations" },
      });
    }
    const audit = audits[project.id];
    if (audit?.status === "ok" && audit.data.report === null && !audit.data.running) {
      attention.push({ id: `unaudited:${project.id}`, tone: "warning", title: `${project.name} has never been audited`, detail: "Run a Repo Audit to see its dependency, security, build and architecture findings.", target: { view: "repo-audit", projectId: project.id } });
    }
    if (audit?.status === "ok" && audit.data.report) {
      const counts = audit.data.report.summary.counts;
      if (counts.critical + counts.high > 0) {
        attention.push({
          id: `findings:${project.id}`,
          tone: counts.critical ? "error" : "warning",
          title: `${project.name}: ${[counts.critical ? `${counts.critical} critical` : "", counts.high ? `${counts.high} high` : ""].filter(Boolean).join(", ")} finding${counts.critical + counts.high === 1 ? "" : "s"}`,
          detail: `From its latest audit, grade ${audit.data.report.summary.grade ?? "not scored"}.`,
          target: { view: "repo-audit", projectId: project.id },
        });
      }
    }
  }
  const queue = engagements.status === "ok" ? engagements.data : [];
  const openRepairs = queue.filter((engagement) => ["requested", "held", "in_progress", "in_review"].includes(engagement.status));
  for (const engagement of queue.filter((entry) => (entry.status === "requested" || entry.status === "held") && !entry.assignee)) {
    attention.push({ id: `repair:${engagement.id}`, tone: "warning", title: `Repair ${engagement.id} has no engineer`, detail: `${engagement.projectId} · ${engagement.findingIds.length} finding${engagement.findingIds.length === 1 ? "" : "s"}`, target: { view: "engagements" } });
  }
  for (const mission of awaiting) {
    attention.push({ id: `mission:${mission.id}`, tone: "warning", title: `${mission.id} awaits your approval`, detail: mission.title, target: { view: "executive-office" } });
  }
  attention.sort((left, right) => (left.tone === "error" ? 0 : 1) - (right.tone === "error" ? 0 : 1));

  return {
    runtime,
    projects,
    audits,
    missions,
    openMissions,
    awaiting,
    audited: audited.length,
    lowest,
    critical,
    attention,
    reload,
    engagements,
    openRepairs,
    act,
    acting,
    actionError,
  };
}

export type InHouseConsole = ReturnType<typeof useInHouseConsole>;
