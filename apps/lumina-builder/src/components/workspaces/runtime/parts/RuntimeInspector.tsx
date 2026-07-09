import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LuminaInspectorSection,
  LuminaMetricCard,
  LuminaPanelHeader,
} from "@/components/lumina/workspace";
import { RuntimeHealthBadge } from "./RuntimeHealthBadge";
import { RuntimeSparkline } from "./RuntimeSparkline";
import { RuntimeActionsToolbar } from "./RuntimeActionsToolbar";
import { RuntimeLogsPanel } from "./RuntimeLogsPanel";
import { RuntimeEmptyState } from "./RuntimeEmptyState";
import { cn } from "@/lib/utils";
import type { LogEntry, RuntimeAction, RuntimeProject } from "@/services/runtime/types";

export interface RuntimeInspectorProps {
  project: RuntimeProject | null;
  logs: LogEntry[];
  pending: Record<string, boolean>;
  onDispatch: (a: RuntimeAction, projectId: string) => Promise<void>;
  className?: string;
}

function fmtUptime(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function RuntimeInspector({ project, logs, pending, onDispatch, className }: RuntimeInspectorProps) {
  if (!project) {
    return (
      <div className={cn("h-full", className)}>
        <RuntimeEmptyState variant="projects" />
      </div>
    );
  }

  const memPct = (project.metrics.memUsedMb / project.metrics.memTotalMb) * 100;
  const projectLogs = logs.filter((l) => l.projectId === project.id);

  return (
    <div className={cn("flex flex-col h-full min-h-0", className)}>
      <LuminaPanelHeader
        title={project.name}
        subtitle={
          <>
            {project.env} · {project.region} · {project.version}
          </>
        }
        leading={
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Inspector
          </div>
        }
        trailing={
          <RuntimeHealthBadge
            status={project.health.status}
            score={project.health.score}
          />
        }
      />

      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-5 mt-4 self-start rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="env">Env</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 min-h-0 overflow-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Uptime"       value={fmtUptime(project.uptimeMs)} />
            <Stat label="RPS"          value={project.metrics.rps.toLocaleString()} />
            <Stat label="p95 latency"  value={`${project.metrics.p95Ms} ms`} />
            <Stat label="Error rate"   value={`${project.metrics.errorRatePct.toFixed(2)}%`} />
          </div>
          {project.health.reasons.length > 0 && (
            <LuminaInspectorSection>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">Health signals</div>
              <ul className="text-[12.5px] space-y-1">
                {project.health.reasons.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </LuminaInspectorSection>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 min-h-0 overflow-auto p-5 space-y-5">
          <LuminaInspectorSection>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">CPU</div>
              <div className="text-[12px] tabular-nums">{project.metrics.cpuPct.toFixed(0)}%</div>
            </div>
            <RuntimeSparkline data={project.metrics.cpuSeries} width={520} height={64} stroke="hsl(var(--cyan))" fill="hsl(var(--cyan) / 0.14)" className="w-full" />
          </LuminaInspectorSection>
          <LuminaInspectorSection>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Memory</div>
              <div className="text-[12px] tabular-nums">{memPct.toFixed(0)}%</div>
            </div>
            <RuntimeSparkline data={project.metrics.memSeries} width={520} height={64} stroke="hsl(var(--magenta))" fill="hsl(var(--magenta) / 0.14)" className="w-full" />
          </LuminaInspectorSection>
        </TabsContent>

        <TabsContent value="env" className="flex-1 min-h-0 overflow-auto p-4 md:p-5">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl divide-y divide-white/6">
            <KV k="Environment" v={project.env} />
            <KV k="Region"      v={project.region} />
            <KV k="Version"     v={project.version} />
            <KV k="State"       v={project.state} />
            <KV k="Started"     v={new Date(project.startedAt).toLocaleString()} />
          </div>
        </TabsContent>

        <TabsContent value="logs" className="flex-1 min-h-0">
          <RuntimeLogsPanel logs={projectLogs} />
        </TabsContent>

        <TabsContent value="actions" className="flex-1 min-h-0 overflow-auto p-4 md:p-5">
          <RuntimeActionsToolbar project={project} pending={pending} onDispatch={onDispatch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <LuminaMetricCard label={label}>
      <div className="font-display text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
    </LuminaMetricCard>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="text-[11.5px] uppercase tracking-[0.1em] text-muted-foreground">{k}</div>
      <div className="text-[12.5px] tabular-nums">{v}</div>
    </div>
  );
}