import { useEffect, useState } from "react";

import { LuminaButton } from "@/components/lumina/LuminaButton";
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
            <div className="grid md:grid-cols-4 gap-4">

              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">
                  Runtime PID
                </div>

                <div className="text-xl font-semibold">
                  {metrics.process.pid}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">
                  Runtime Count
                </div>

                <div className="text-xl font-semibold">
                  {metrics.totals.runtimes}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">
                  Event Clients
                </div>

                <div className="text-xl font-semibold">
                  {metrics.totals.eventClients}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">
                  Watchers
                </div>

                <div className="text-xl font-semibold">
                  {metrics.totals.workspaceWatchers}
                </div>
              </div>

            </div>

            <div className="rounded-xl border overflow-hidden">
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
                        {runtime.status}
                      </td>

                      <td className="p-3">
                        {runtime.port}
                      </td>

                      <td className="p-3">
                        {runtime.pid}
                      </td>

                      <td className="p-3">
                        {String(runtime.alive)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
