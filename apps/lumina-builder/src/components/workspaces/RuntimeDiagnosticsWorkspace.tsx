import { useEffect, useState } from "react";

import { LuminaButton } from "@/components/lumina/LuminaButton";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  canAccess,
} from "@/services/workspaceAccessService";

import {
  getRuntimeMetrics,
  type RuntimeMetricsResponse,
} from "@/services/runtimeService";

export function RuntimeDiagnosticsWorkspace() {
  const { setView } = useWorkspace();

  const [metrics, setMetrics] =
    useState<RuntimeMetricsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const allowed =
    canAccess("deploymentDiagnostics");

  useEffect(() => {
    if (!allowed) {
      setView("dashboard");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const data =
          await getRuntimeMetrics();

        if (!cancelled) {
          setMetrics(data);
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
  }, [allowed, setView]);

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
              Runtime health, registry and metrics.
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
            <div className={
              metrics.totals.error > 0
                ? "rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/80 via-red-950/90 to-slate-950/95 backdrop-blur-2xl p-4"
                : metrics.totals.running > 0
                ? "rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/80 via-emerald-950/90 to-slate-950/95 backdrop-blur-2xl p-4"
                : metrics.totals.runtimes > 0
                ? "rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/80 via-amber-950/90 to-slate-950/95 backdrop-blur-2xl p-4"
                : "rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/80 via-cyan-950/90 to-slate-950/95 backdrop-blur-2xl p-4"
            }>
              <div
                className={
                  metrics.totals.error > 0
                    ? "font-medium text-red-300"
                    : metrics.totals.running > 0
                    ? "font-medium text-emerald-300"
                    : metrics.totals.runtimes > 0
                    ? "font-medium text-amber-300"
                    : "font-medium text-cyan-300"
                }
              >
                {
                  metrics.totals.error > 0
                    ? "Runtime Error"
                    : metrics.totals.running > 0
                    ? "Runtime Healthy"
                    : metrics.totals.runtimes > 0
                    ? "Runtime Idle"
                    : "No Active Runtime"
                }
              </div>

              <div className="text-sm text-muted-foreground">
                {metrics.totals.runtimes === 0
                  ? "Start a project preview to launch a runtime."
                  : metrics.totals.running > 0
                  ? `${metrics.totals.running} running · ${metrics.totals.runtimes} registered · RSS ${metrics.process.memory.rssMb} MB`
                  : `${metrics.totals.runtimes} registered · waiting for startup`}
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">

              <div className="rounded-2xl backdrop-blur-xl border border-cyan-500/20 bg-cyan-950/90 p-5">
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

            </div>

            {metrics.runtimes.length === 0 ? (
              <div className="rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/10 p-10 text-center">
                <div className="text-xl font-semibold">
                  No active runtimes
                </div>

                <div className="mt-2 text-sm text-muted-foreground">
                  Start a project preview to view runtime activity,
                  ports, process information and health status.
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Project</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Port</th>
                    <th className="text-left p-3">PID</th>
                    <th className="text-left p-3">Alive</th>
                  </tr>
                </thead>

                <tbody>
                  {metrics.runtimes.map((runtime) => (
                    <tr
                      key={runtime.projectId}
                      className="border-b"
                    >
                      <td className="p-3">
                        {runtime.projectId}
                      </td>

                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            runtime.status === "running"
                              ? "border-emerald-500/30 text-emerald-300"
                              : runtime.status === "starting"
                              ? "border-amber-500/30 text-amber-300"
                              : runtime.status === "error"
                              ? "border-red-500/30 text-red-300"
                              : "border-slate-500/30 text-slate-300"
                          }
                        >
                          {runtime.status}
                        </Badge>
                      </td>

                      <td className="p-3">
                        {runtime.port}
                      </td>

                      <td className="p-3">
                        {runtime.pid}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
