import {
  connectRuntimeEvents,
  getRuntimeLogs,
  getRuntimeMetrics,
  listRuntimeProjects,
  restartRuntime,
  startRuntime,
  stopRuntime,
  type RuntimeEvent as BuilderRuntimeEvent,
  type RuntimeMetricsResponse,
  type RuntimeProject as BuilderRuntimeProject,
} from "@/services/runtimeService";

import type {
  Environment,
  HealthStatus,
  LifecycleEvent,
  LogEntry,
  RuntimeAction,
  RuntimeEvent,
  RuntimeHealth,
  RuntimeMetrics,
  RuntimeOperationsService,
  RuntimeProject,
  RuntimeSnapshot,
  RuntimeState,
} from "./types";

function titleFromProjectId(projectId: string) {
  return projectId
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferEnvironment(projectId: string): Environment {
  const normalized = projectId.toLowerCase();

  if (normalized.includes("prod")) {
    return "production";
  }

  if (
    normalized.includes("stage") ||
    normalized.includes("staging")
  ) {
    return "staging";
  }

  return "preview";
}

function mapState(status?: string | null): RuntimeState {
  switch ((status ?? "").toLowerCase()) {
    case "starting":
      return "starting";
    case "running":
      return "running";
    case "restarting":
      return "restarting";
    case "stopped":
    case "exited":
      return "stopped";
    case "error":
      return "error";
    case "idle":
      return "idle";
    default:
      return "idle";
  }
}

function mapHealth(input: {
  status?: string | null;
  alive?: boolean;
  lastError?: string | null;
}): RuntimeHealth {
  if (input.lastError || input.status === "error") {
    return {
      status: "critical",
      score: 20,
      reasons: [
        input.lastError ?? "Runtime reported an error state.",
      ],
    };
  }

  if (input.status === "running" && input.alive) {
    return {
      status: "healthy",
      score: 96,
      reasons: ["Runtime process is running and alive."],
    };
  }

  if (input.status === "starting" || input.status === "restarting") {
    return {
      status: "degraded",
      score: 70,
      reasons: ["Runtime is transitioning."],
    };
  }

  return {
    status: "offline",
    score: 0,
    reasons: ["Runtime is not currently running."],
  };
}

function mapOverallHealth(
  metrics: RuntimeMetricsResponse | null,
): RuntimeHealth {
  if (!metrics) {
    return {
      status: "offline",
      score: 0,
      reasons: ["Runtime metrics are unavailable."],
    };
  }

  if (metrics.totals.error > 0) {
    return {
      status: "critical",
      score: 35,
      reasons: [`${metrics.totals.error} runtime(s) are reporting errors.`],
    };
  }

  if (metrics.totals.starting > 0) {
    return {
      status: "degraded",
      score: 75,
      reasons: [`${metrics.totals.starting} runtime(s) are starting.`],
    };
  }

  if (metrics.totals.running > 0) {
    return {
      status: "healthy",
      score: 96,
      reasons: [`${metrics.totals.running} runtime(s) are running.`],
    };
  }

  return {
    status: "offline",
    score: 0,
    reasons: ["No runtimes are currently running."],
  };
}

function emptyRuntimeMetrics(): RuntimeMetrics {
  return {
    cpuPct: 0,
    memUsedMb: 0,
    memTotalMb: 0,
    rps: 0,
    p95Ms: 0,
    errorRatePct: 0,
    cpuSeries: Array.from({ length: 60 }, () => 0),
    memSeries: Array.from({ length: 60 }, () => 0),
  };
}

function eventSeverity(
  event: BuilderRuntimeEvent,
): RuntimeEvent["severity"] {
  if (event.type === "runtime:error") {
    return "error";
  }

  if (event.type === "runtime:state") {
    return event.status === "running" ? "success" : "info";
  }

  return "info";
}

function eventMessage(event: BuilderRuntimeEvent) {
  if (event.type === "runtime:log") {
    return event.line;
  }

  if (event.type === "runtime:state") {
    return `Runtime state changed to ${event.status}`;
  }

  if (event.type === "runtime:error") {
    return event.error;
  }

  if (event.type === "runtime:file-changed") {
    return `File changed: ${event.file}`;
  }

  return "Runtime event";
}

function mapRuntimeEvent(
  event: BuilderRuntimeEvent,
): RuntimeEvent {
  return {
    id: `${event.type}:${event.projectId}:${event.timestamp}`,
    projectId: event.projectId,
    kind:
      event.type === "runtime:error"
        ? "alert"
        : event.type === "runtime:state"
          ? "health"
          : "health",
    message: eventMessage(event),
    at: event.timestamp,
    severity: eventSeverity(event),
  };
}

function mapLogEvent(
  event: BuilderRuntimeEvent,
): LogEntry | null {
  if (event.type !== "runtime:log") {
    return null;
  }

  return {
    id: `log:${event.projectId}:${event.timestamp}:${event.line}`,
    projectId: event.projectId,
    at: event.timestamp,
    level: "info",
    source: "runtime",
    message: event.line,
  };
}

function logsToEntries(
  projectId: string,
  lines: string[],
): LogEntry[] {
  const now = Date.now();

  return lines.map((line, index) => ({
    id: `log:${projectId}:${index}:${line}`,
    projectId,
    at: now - Math.max(0, lines.length - index) * 1000,
    level:
      line.toLowerCase().includes("error")
        ? "error"
        : line.toLowerCase().includes("warn")
          ? "warn"
          : "info",
    source: "runtime",
    message: line,
  }));
}

export class RealRuntimeOperationsService
  implements RuntimeOperationsService
{
  private snapshot: RuntimeSnapshot = {
    projects: [],
    events: [],
    timeline: [],
    logs: [],
    overall: {
      health: {
        status: "offline",
        score: 0,
        reasons: ["Runtime has not been loaded yet."],
      },
      running: 0,
      total: 0,
      avgCpu: 0,
      avgMem: 0,
      totalRps: 0,
    },
    updatedAt: Date.now(),
  };

  private listeners =
    new Set<(snapshot: RuntimeSnapshot) => void>();

  private refreshTimer: number | null = null;
  private disconnectEvents: (() => void) | null = null;
  private refreshing = false;

  getSnapshot(): RuntimeSnapshot {
    return this.snapshot;
  }

  subscribe(
    cb: (snapshot: RuntimeSnapshot) => void,
  ): () => void {
    this.listeners.add(cb);

    cb(this.snapshot);

    if (this.listeners.size === 1) {
      this.start();
    }

    void this.refresh();

    return () => {
      this.listeners.delete(cb);

      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  async dispatch(
    action: RuntimeAction,
    projectId: string,
    opts?: {
      version?: string;
    },
  ): Promise<void> {
    if (action === "start") {
      await startRuntime(projectId);
    } else if (action === "restart") {
      await restartRuntime(projectId);
    } else if (action === "shutdown") {
      await stopRuntime(projectId);
    } else if (action === "drain") {
      throw new Error("runtime_drain_not_supported");
    } else if (action === "rollback") {
      throw new Error(
        opts?.version
          ? "runtime_rollback_not_supported"
          : "runtime_rollback_requires_version",
      );
    }

    await this.refresh();
  }

  private start() {
    if (!this.disconnectEvents) {
      this.disconnectEvents =
        connectRuntimeEvents(
          (event) => {
            this.applyEvent(event);
          },
          () => {
            // SSE disconnects are non-fatal; polling remains active.
          },
        );
    }

    if (!this.refreshTimer) {
      this.refreshTimer =
        window.setInterval(
          () => {
            void this.refresh();
          },
          5000,
        );
    }
  }

  private stop() {
    if (this.disconnectEvents) {
      this.disconnectEvents();
      this.disconnectEvents = null;
    }

    if (this.refreshTimer) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private async refresh() {
    if (this.refreshing) {
      return;
    }

    this.refreshing = true;

    try {
      const [metrics, runtimeProjects] =
        await Promise.all([
          getRuntimeMetrics(),
          listRuntimeProjects(),
        ]);

      const projectIds =
        new Set<string>();

      for (const project of runtimeProjects) {
        projectIds.add(project.projectId);
      }

      for (const runtime of metrics.runtimes) {
        projectIds.add(runtime.projectId);
      }

      const logs =
        await this.loadLogs(
          Array.from(projectIds),
        );

      this.snapshot =
        this.buildSnapshot(
          metrics,
          runtimeProjects,
          logs,
        );

      this.emit();
    } finally {
      this.refreshing = false;
    }
  }

  private async loadLogs(
    projectIds: string[],
  ): Promise<LogEntry[]> {
    const results =
      await Promise.all(
        projectIds.map(
          async (projectId) => {
            try {
              const lines =
                await getRuntimeLogs(
                  projectId,
                );

              return logsToEntries(
                projectId,
                lines.slice(-120),
              );
            } catch {
              return [];
            }
          },
        ),
      );

    return results.flat();
  }

  private buildSnapshot(
    metrics: RuntimeMetricsResponse,
    runtimeProjects: BuilderRuntimeProject[],
    logs: LogEntry[],
  ): RuntimeSnapshot {
    const runtimeById =
      new Map(
        metrics.runtimes.map(
          (runtime) => [
            runtime.projectId,
            runtime,
          ],
        ),
      );

    const projects =
      runtimeProjects.map((project) => {
        const runtime =
          runtimeById.get(
            project.projectId,
          );

        return this.mapProject(
          project,
          runtime,
        );
      });

    for (const runtime of metrics.runtimes) {
      if (
        !projects.some(
          (project) =>
            project.id === runtime.projectId,
        )
      ) {
        projects.push(
          this.mapProject(
            {
              projectId: runtime.projectId,
              path: "",
              hasPackageJson: true,
              framework:
                runtime.framework ?? undefined,
            },
            runtime,
          ),
        );
      }
    }

    const timeline =
      metrics.runtimes.flatMap(
        (runtime): LifecycleEvent[] => {
          const now = Date.now();
          const startedAt =
            runtime.startedAt ?? now;

          const events: LifecycleEvent[] = [];

          events.push({
            id: `boot:${runtime.projectId}:${startedAt}`,
            projectId: runtime.projectId,
            phase: "boot",
            label: "Runtime boot",
            at: startedAt,
          });

          if (runtime.status === "running") {
            events.push({
              id: `ready:${runtime.projectId}:${startedAt}`,
              projectId: runtime.projectId,
              phase: "ready",
              label: "Runtime ready",
              at: startedAt,
              durationMs:
                runtime.uptimeMs,
            });
          }

          if (runtime.status === "exited") {
            events.push({
              id: `stop:${runtime.projectId}:${runtime.exitedAt ?? now}`,
              projectId: runtime.projectId,
              phase: "stop",
              label: "Runtime stopped",
              at: runtime.exitedAt ?? now,
            });
          }

          return events;
        },
      );

    return {
      projects,
      events:
        this.snapshot.events.slice(
          -200,
        ),
      timeline,
      logs:
        logs
          .sort((a, b) => a.at - b.at)
          .slice(-500),
      overall: {
        health:
          mapOverallHealth(
            metrics,
          ),
        running:
          metrics.totals.running,
        total:
          projects.length,
        avgCpu: 0,
        avgMem:
          metrics.process.memory.rssMb,
        totalRps: 0,
      },
      updatedAt:
        metrics.timestamp ?? Date.now(),
    };
  }

  private mapProject(
    project: BuilderRuntimeProject,
    runtime:
      | RuntimeMetricsResponse["runtimes"][number]
      | undefined,
  ): RuntimeProject {
    const health =
      mapHealth({
        status:
          runtime?.status,
        alive:
          runtime?.alive,
        lastError:
          runtime?.lastError,
      });

    return {
      id: project.projectId,
      name:
        project.repoName ??
        titleFromProjectId(
          project.projectId,
        ),
      env:
        inferEnvironment(
          project.projectId,
        ),
      region: "local",
      version:
        project.framework ??
        runtime?.framework ??
        "runtime",
      state:
        mapState(
          runtime?.status,
        ),
      health,
      startedAt:
        runtime?.startedAt ?? 0,
      uptimeMs:
        runtime?.uptimeMs ?? 0,
      metrics:
        emptyRuntimeMetrics(),
    };
  }

  private applyEvent(
    event: BuilderRuntimeEvent,
  ) {
    const runtimeEvent =
      mapRuntimeEvent(event);

    const nextEvents = [
      ...this.snapshot.events,
      runtimeEvent,
    ].slice(-200);

    const logEntry =
      mapLogEvent(event);

    const nextLogs =
      logEntry
        ? [
            ...this.snapshot.logs,
            logEntry,
          ].slice(-500)
        : this.snapshot.logs;

    this.snapshot = {
      ...this.snapshot,
      events: nextEvents,
      logs: nextLogs,
      updatedAt: Date.now(),
    };

    this.emit();

    if (
      event.type === "runtime:state" ||
      event.type === "runtime:error"
    ) {
      void this.refresh();
    }
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }
}
