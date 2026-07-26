import { useEffect, useMemo, useRef, useState } from "react";

import { LuminaButton } from "@/components/lumina/LuminaButton";
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

  if (!allowed) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold">
              Runtime Diagnostics
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Runtime health, registry, logs and operations.
            </p>
          </div>

          <LuminaButton
            variant="ghost"
            onClick={() => setView("dashboard")}
          >
            ← Back to Projects
          </LuminaButton>
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground">
            Loading metrics...
          </div>
        )}

        {metrics && (
          <>
            <div
              className={
                metrics.totals.error > 0
                  ? "rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/80 via-red-950/90 to-slate-950/95 backdrop-blur-2xl p-4"
                  : metrics.totals.running > 0
                  ? "rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/80 via-emerald-950/90 to-slate-950/95 backdrop-blur-2xl p-4"
                  : metrics.totals.runtimes > 0
                  ? "rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/80 via-amber-950/90 to-slate-950/95 backdrop-blur-2xl p-4"
                  : "rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/80 via-cyan-950/90 to-slate-950/95 backdrop-blur-2xl p-4"
              }
            >
              <div
                className={
                  metrics.totals.error > 0
                    ? "font-medium text-red-300"
                    : metrics.totals.running > 0
                    ? "font-medium text-emerald-300"
                    : metrics.totals.runtimes > 0
                    ? "font-medium text-amber-300"
                    : "font-medium text-cyan"
                }
              >
                {metrics.totals.error > 0
                  ? "Runtime Error"
                  : metrics.totals.running > 0
                  ? "Runtime Healthy"
                  : metrics.totals.runtimes > 0
                  ? "Runtime Idle"
                  : "No Active Runtime"}
              </div>

              <div className="text-sm text-muted-foreground">
                {metrics.totals.runtimes === 0
                  ? "Start a project preview to launch a runtime."
                  : metrics.totals.running > 0
                  ? `${metrics.totals.running} running · ${metrics.totals.runtimes} registered · RSS ${metrics.process.memory.rssMb} MB`
                  : `${metrics.totals.runtimes} registered · waiting for startup`}
              </div>
            </div>

            {actionError && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/50 p-3 text-sm text-red-300">
                {actionError}
              </div>
            )}

            <div className="grid md:grid-cols-5 gap-4">
              <div className="rounded-2xl backdrop-blur-xl border border-cyan-500/20 bg-slate-950/95 p-5">
                <div className="text-xs text-muted-foreground">
                  Supervisor PID
                </div>

                <div className="text-4xl font-bold tracking-tight mt-2">
                  {metrics.process.pid}
                </div>
              </div>

              <div className="rounded-2xl backdrop-blur-xl border border-emerald-500/20 bg-emerald-950/90 p-5">
                <div className="text-xs text-muted-foreground">
                  Runtime Count
                </div>

                <div className="text-5xl font-black tracking-tight mt-2">
                  {metrics.totals.runtimes}
                </div>
              </div>

              <div className="rounded-2xl backdrop-blur-xl border border-violet-500/20 bg-violet-950/90 p-5">
                <div className="text-xs text-muted-foreground">
                  Event Clients
                </div>

                <div className="text-4xl font-bold tracking-tight mt-2">
                  {metrics.totals.eventClients}
                </div>
              </div>

              <div className="rounded-2xl backdrop-blur-xl border border-amber-500/20 bg-amber-950/90 p-5">
                <div className="text-xs text-muted-foreground">
                  Watchers
                </div>

                <div className="text-4xl font-bold tracking-tight mt-2">
                  {metrics.totals.workspaceWatchers}
                </div>
              </div>

              <div className="rounded-2xl backdrop-blur-xl border border-rose-500/20 bg-rose-950/90 p-5">
                <div className="text-xs text-muted-foreground">
                  Restarts
                </div>

                <div className="text-4xl font-bold tracking-tight mt-2">
                  {metrics.restarts.length}
                </div>
              </div>
            </div>

            {metrics.restarts.length > 0 && (
              <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="font-semibold">
                    Runtime Recovery
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead>
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
            )}

            {metrics.runtimes.length === 0 ? (
              <div className="rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/10 p-8 space-y-4">
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
                    className="h-10 rounded-xl bg-slate-950/80 border border-white/10 px-3 text-sm"
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

                  <LuminaButton
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
                  </LuminaButton>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
                <table className="w-full text-sm">
                  <thead>
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
                          <LuminaButton
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              void loadLogs(
                                runtime.projectId,
                              )
                            }
                          >
                            Logs
                          </LuminaButton>
                        </td>

                        <td className="p-3">
                          <div className="flex gap-2">
                            <LuminaButton
                              size="sm"
                              variant="ghost"
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
                            </LuminaButton>

                            <LuminaButton
                              size="sm"
                              variant="ghost"
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
                            </LuminaButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedProject && (
              <div className="rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/10 p-4">
                <div className="font-medium mb-3">
                  Runtime Logs · {selectedProject}
                </div>

                <pre
                  ref={logContainerRef}
                  className="text-xs overflow-auto max-h-[400px] whitespace-pre-wrap"
                >
                  {logs.length > 0
                    ? logs.join("\n")
                    : "No logs available"}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
