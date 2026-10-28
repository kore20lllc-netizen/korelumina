import { useEffect, useMemo, useRef, useState } from "react";

import { Activity, Cpu, Radio, Eye, RotateCcw, ServerCog, ScrollText } from "lucide-react";
import { LuminaFlagshipPanel } from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";
import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import { LuminaSectionNavigator } from "@/components/lumina/workspace/primitives/LuminaSectionNavigator";
import { ExecutiveMetricCard } from "./knowledge-v3/layout/ExecutiveMetricCard";
import { panelEyebrow, pillButton, quietButton } from "./developer/shared/surfaces";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  canAccess,
} from "@/services/workspaceAccessService";

import {
  getRuntimeLogs,
  getRuntimeMetrics,
  connectRuntimeEvents,
  listRuntimeProjects,
  restartRuntime,
  startRuntime,
  stopRuntime,
  type RuntimeMetricsResponse,
  type RuntimeProject,
} from "@/services/runtimeService";

function statusBadgeClass(status: string) {
  if (status === "running") {
    return "border-emerald-500/30 text-emerald-300";
  }

  if (status === "starting") {
    return "border-amber-500/30 text-amber-300";
  }

  if (status === "error") {
    return "border-red-500/30 text-red-300";
  }

  return "border-slate-500/30 text-slate-300";
}

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0s";
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}

export function RuntimeDiagnosticsWorkspace() {
  const { setView } = useWorkspace();

  const [metrics, setMetrics] =
    useState<RuntimeMetricsResponse | null>(null);

  const [projects, setProjects] =
    useState<RuntimeProject[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [actionBusy, setActionBusy] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [selectedProject, setSelectedProject] =
    useState<string | null>(null);

  const [logs, setLogs] =
    useState<string[]>([]);

  const logContainerRef =
    useRef<HTMLPreElement | null>(
      null,
    );

  const [startProjectId, setStartProjectId] =
    useState("");

  const allowed =
    canAccess("deploymentDiagnostics");

  const runtimeProjectOptions =
    useMemo(
      () =>
        projects.filter(
          (project) => project.hasPackageJson,
        ),
      [projects],
    );

  async function refresh() {
    const [nextMetrics, nextProjects] =
      await Promise.all([
        getRuntimeMetrics(),
        listRuntimeProjects(),
      ]);

    setMetrics(nextMetrics);
    setProjects(nextProjects);

    if (
      !startProjectId &&
      nextProjects.length > 0
    ) {
      const firstReady =
        nextProjects.find(
          (project) => project.hasPackageJson,
        ) ?? nextProjects[0];

      setStartProjectId(
        firstReady.projectId,
      );
    }
  }

  async function loadLogs(
    projectId: string,
  ) {
    try {
      const data =
        await getRuntimeLogs(
          projectId,
        );

      setSelectedProject(projectId);
      setLogs(data);
    } catch {
      setSelectedProject(projectId);
      setLogs([]);
    }
  }

  async function runRuntimeAction(
    key: string,
    action: () => Promise<unknown>,
  ) {
    try {
      setActionBusy(key);
      setActionError(null);

      await action();
      await refresh();

      if (selectedProject) {
        await loadLogs(selectedProject);
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "runtime_action_failed",
      );
    } finally {
      setActionBusy(null);
    }
  }

  useEffect(() => {
    const disconnect =
      connectRuntimeEvents(
        (event) => {
          if (
            event.type !==
              "runtime:log" ||
            !selectedProject ||
            event.projectId !==
              selectedProject
          ) {
            return;
          }

          setLogs((current) => {
            const next = [
              ...current,
              event.line,
            ];

            if (
              next.length > 300
            ) {
              next.splice(
                0,
                next.length - 300,
              );
            }

            return next;
          });
        },
      );

    return () => {
      disconnect();
    };
  }, [selectedProject]);

  useEffect(() => {
    if (!allowed) {
      setView("dashboard");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [nextMetrics, nextProjects] =
          await Promise.all([
            getRuntimeMetrics(),
            listRuntimeProjects(),
          ]);

        if (!cancelled) {
          setMetrics(nextMetrics);
          setProjects(nextProjects);

          if (
            !startProjectId &&
            nextProjects.length > 0
          ) {
            const firstReady =
              nextProjects.find(
                (project) => project.hasPackageJson,
              ) ?? nextProjects[0];

            setStartProjectId(
              firstReady.projectId,
            );
          }
        }
      } catch (error) {
        console.error(
          "[RuntimeDiagnostics]",
          error,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    const timer =
      window.setInterval(
        load,
        5000,
      );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [allowed, setView, startProjectId]);

  useEffect(() => {
    const node =
      logContainerRef.current;

    if (!node) {
      return;
    }

    node.scrollTop =
      node.scrollHeight;
  }, [logs]);

  const sections = useMemo(() => [
    { id: "diagnostics-overview", label: "Overview", icon: Activity },
    ...(metrics?.restarts.length ? [{ id: "diagnostics-recovery", label: "Recovery", icon: RotateCcw }] : []),
    { id: "diagnostics-registry", label: "Registry", icon: ServerCog },
    ...(selectedProject ? [{ id: "diagnostics-logs", label: "Logs", icon: ScrollText }] : []),
  ], [!!metrics?.restarts.length, !!selectedProject]);

  if (!allowed) {
    return null;
  }

  return (
    <section aria-label="Runtime Diagnostics" className="relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent text-white">
      <div id="diagnostics-top" className="space-y-5 p-4 md:p-6">
        <LuminaFlagshipCard as="article" className="p-5 md:p-8">
          <header className="relative z-10 flex min-w-0 flex-col items-start justify-between gap-5 sm:flex-row">
            <div className="min-w-0">
              <div className={panelEyebrow}>Universal Runtime</div>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                <span className="text-gradient-lumina">Runtime</span>{" "}
                <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">Diagnostics</span>
              </h1>
              <p className="mt-3 text-sm leading-6 text-sky-300/75">Runtime health, registry, logs and operations.</p>
            </div>
            <button type="button" className={`${quietButton} shrink-0`} onClick={() => setView("dashboard")}>← Back to Projects</button>
          </header>
        </LuminaFlagshipCard>
        {metrics && <LuminaSectionNavigator items={sections} ariaLabel="Runtime Diagnostics sections" topTargetId="diagnostics-top" minWidthClassName="min-w-[480px]" gridColumnsClassName={sections.length === 4 ? "grid-cols-4" : sections.length === 3 ? "grid-cols-3" : "grid-cols-2"} />}

        {loading && (
          <div className="text-sm text-muted-foreground">
            Loading metrics...
          </div>
        )}

        {metrics && (
          <>
            <LuminaFlagshipPanel id="diagnostics-overview" className="scroll-mt-24" title="Runtime health">
              <div className="relative z-10 space-y-2 p-5">
                <div className={`text-lg font-semibold ${metrics.totals.error > 0 ? "text-red-300" : metrics.totals.running > 0 ? "text-emerald-300" : metrics.totals.runtimes > 0 ? "text-amber-300" : "text-cyan-300"}`}>
                  {metrics.totals.error > 0
                  ? "Runtime Error"
                  : metrics.totals.running > 0
                  ? "Runtime Healthy"
                  : metrics.totals.runtimes > 0
                  ? "Runtime Idle"
                  : "No Active Runtime"}
                </div>
                <p className="text-sm leading-6 text-white/60">{metrics.totals.runtimes === 0
                  ? "Start a project preview to launch a runtime."
                  : metrics.totals.running > 0
                  ? `${metrics.totals.running} running · ${metrics.totals.runtimes} registered · RSS ${metrics.process.memory.rssMb} MB`
                  : `${metrics.totals.runtimes} registered · waiting for startup`}</p>
              </div>
            </LuminaFlagshipPanel>

            {actionError && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/50 p-3 text-sm text-red-300">
                {actionError}
              </div>
            )}

            <div aria-label="Runtime metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {[
                { id: "pid", label: "Supervisor PID", value: String(metrics.process.pid), detail: "Runtime supervisor process", icon: Cpu, accent: "text-cyan-300", surface: "bg-cyan-400/15" },
                { id: "count", label: "Runtime Count", value: String(metrics.totals.runtimes), detail: "Registered runtimes", icon: ServerCog, accent: "text-emerald-300", surface: "bg-emerald-400/15" },
                { id: "events", label: "Event Clients", value: String(metrics.totals.eventClients), detail: "Connected event clients", icon: Radio, accent: "text-violet-300", surface: "bg-violet-400/15" },
                { id: "watchers", label: "Watchers", value: String(metrics.totals.workspaceWatchers), detail: "Workspace watchers", icon: Eye, accent: "text-amber-300", surface: "bg-amber-400/15" },
                { id: "restarts", label: "Restarts", value: String(metrics.restarts.length), detail: "Projects with restart history", icon: RotateCcw, accent: "text-rose-300", surface: "bg-rose-400/15" },
              ].map(metric => <ExecutiveMetricCard key={metric.id} metric={metric} />)}
            </div>

            {metrics.restarts.length > 0 && (
              <LuminaFlagshipPanel id="diagnostics-recovery" className="min-w-0 scroll-mt-24" title="Runtime Recovery">
                <div role="region" aria-label="Runtime recovery table" tabIndex={0} className="relative z-10 max-h-[440px] overflow-auto overscroll-contain">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-950 text-[10px] uppercase tracking-[0.12em] text-cyan-200/80">
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3">Project</th>
                      <th className="text-left p-3">Restarts</th>
                      <th className="text-left p-3">Last Restart</th>
                      <th className="text-left p-3">Last Recovery</th>
                      <th className="text-left p-3">Reason</th>
                    </tr>
                  </thead>

                  <tbody>
                    {metrics.restarts.map((restart) => (
                      <tr
                        key={restart.projectId}
                        className="border-b border-white/5"
                      >
                        <td className="p-3">
                          {restart.projectId}
                        </td>

                        <td className="p-3">
                          {restart.count}
                        </td>

                        <td className="p-3">
                          {new Date(
                            restart.lastRestartAt,
                          ).toLocaleString()}
                        </td>

                        <td className="p-3">
                          {restart.lastRecoveredAt
                            ? new Date(
                                restart.lastRecoveredAt,
                              ).toLocaleString()
                            : "—"}
                        </td>

                        <td className="p-3">
                          {restart.lastFailureReason ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </LuminaFlagshipPanel>
            )}

            {metrics.runtimes.length === 0 ? (
              <LuminaFlagshipPanel id="diagnostics-registry" className="min-w-0 scroll-mt-24" title="Runtime Registry">
                <div className="relative z-10 space-y-4 p-5">
                <div>
                  <div className="text-xl font-semibold">
                    No active runtimes
                  </div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    Start a runtime from a project workspace, or launch one directly from diagnostics.
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <select
                    value={startProjectId}
                    onChange={(event) =>
                      setStartProjectId(
                        event.target.value,
                      )
                    }
                    aria-label="Project to start"
                    className="h-10 min-w-0 max-w-full rounded-full border border-cyan-300/30 bg-slate-950/80 px-3 text-sm text-sky-100 focus-visible:outline-cyan-300"
                  >
                    {runtimeProjectOptions.map((project) => (
                      <option
                        key={project.projectId}
                        value={project.projectId}
                      >
                        {project.projectId}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className={pillButton("healthy")}
                    disabled={
                      !startProjectId ||
                      actionBusy === `start:${startProjectId}`
                    }
                    onClick={() =>
                      runRuntimeAction(
                        `start:${startProjectId}`,
                        () => startRuntime(startProjectId),
                      )
                    }
                  >
                    {actionBusy === `start:${startProjectId}`
                      ? "Starting..."
                      : "Start Runtime"}
                  </button>
                </div>
                </div>
              </LuminaFlagshipPanel>
            ) : (
              <LuminaFlagshipPanel id="diagnostics-registry" className="min-w-0 scroll-mt-24" title="Runtime Registry">
                <div role="region" aria-label="Runtime registry table" tabIndex={0} className="relative z-10 max-h-[560px] overflow-auto overscroll-contain">
                <table className="w-full min-w-[1040px] text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-950 text-[10px] uppercase tracking-[0.12em] text-cyan-200/80">
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3">Project</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Framework</th>
                      <th className="text-left p-3">Port</th>
                      <th className="text-left p-3">PID</th>
                      <th className="text-left p-3">Uptime</th>
                      <th className="text-left p-3">Alive</th>
                      <th className="text-left p-3">Logs</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {metrics.runtimes.map((runtime) => (
                      <tr
                        key={runtime.projectId}
                        className="border-b border-white/10"
                      >
                        <td className="p-3">
                          {runtime.projectId}
                        </td>

                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={statusBadgeClass(runtime.status)}
                          >
                            {runtime.status}
                          </Badge>
                        </td>

                        <td className="p-3">
                          {runtime.framework ?? "unknown"}
                        </td>

                        <td className="p-3">
                          {runtime.port ?? "—"}
                        </td>

                        <td className="p-3">
                          {runtime.pid ?? "—"}
                        </td>

                        <td className="p-3">
                          {formatDuration(runtime.uptimeMs)}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                runtime.alive
                                  ? "h-2 w-2 rounded-full bg-emerald-400"
                                  : "h-2 w-2 rounded-full bg-red-400"
                              }
                            />
                            {runtime.alive ? "Alive" : "Dead"}
                          </div>
                        </td>

                        <td className="p-3">
                          <button
                            type="button"
                            className={quietButton}
                            onClick={() =>
                              void loadLogs(
                                runtime.projectId,
                              )
                            }
                          >
                            Logs
                          </button>
                        </td>

                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className={pillButton("warning")}
                              disabled={
                                actionBusy === `restart:${runtime.projectId}`
                              }
                              onClick={() =>
                                runRuntimeAction(
                                  `restart:${runtime.projectId}`,
                                  () =>
                                    restartRuntime(
                                      runtime.projectId,
                                    ),
                                )
                              }
                            >
                              {actionBusy === `restart:${runtime.projectId}`
                                ? "Restarting..."
                                : "Restart"}
                            </button>

                            <button
                              type="button"
                              className={pillButton("warning")}
                              disabled={
                                actionBusy === `stop:${runtime.projectId}`
                              }
                              onClick={() =>
                                runRuntimeAction(
                                  `stop:${runtime.projectId}`,
                                  () =>
                                    stopRuntime(
                                      runtime.projectId,
                                    ),
                                )
                              }
                            >
                              {actionBusy === `stop:${runtime.projectId}`
                                ? "Stopping..."
                                : "Stop"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </LuminaFlagshipPanel>
            )}

            {selectedProject && (
              <LuminaFlagshipPanel id="diagnostics-logs" className="min-w-0 scroll-mt-24" title="Runtime Logs" description={<span className="break-all">{selectedProject}</span>}>

                <pre
                  ref={logContainerRef}
                  tabIndex={0}
                  aria-label="Runtime log output"
                  className="relative z-10 m-4 max-h-[400px] overflow-auto overscroll-contain whitespace-pre-wrap break-words rounded-xl bg-slate-950/60 p-4 font-mono text-xs leading-6 text-sky-100/80"
                >
                  {logs.length > 0
                    ? logs.join("\n")
                    : "No logs available"}
                </pre>
              </LuminaFlagshipPanel>
            )}
          </>
        )}
      </div>
    </section>
  );
}
