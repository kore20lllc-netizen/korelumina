import { Activity, Cpu, MemoryStick, Gauge } from "lucide-react";
import { LuminaMetricGrid } from "@/components/lumina/workspace";
import { RuntimeMetricTile } from "./RuntimeMetricTile";
import type { RuntimeOverall, RuntimeProject } from "@/services/runtime/types";

export function RuntimeHealthOverview({ overall, projects }: { overall: RuntimeOverall; projects: RuntimeProject[] }) {
  // Derive aggregate sparklines from the average across projects.
  const cpuTrend = aggregateSeries(projects.map((p) => p.metrics.cpuSeries));
  const memTrend = aggregateSeries(projects.map((p) => p.metrics.memSeries));
  const rpsTrend = aggregateSeries(projects.map((p) => scaleSeries(p.metrics.cpuSeries, p.metrics.rps / Math.max(1, avg(p.metrics.cpuSeries)))));

  return (
    <LuminaMetricGrid>
      <RuntimeMetricTile
        label="Global Health" value={`${overall.health.score}`}
        hint={`${overall.running}/${overall.total} running`}
        icon={Activity} accent="violet"
        trend={aggregateSeries([cpuTrend, memTrend]).map((v) => 100 - v * 0.4)}
      />
      <RuntimeMetricTile
        label="Avg CPU" value={`${overall.avgCpu.toFixed(0)}%`}
        hint={`${overall.total} services`}
        icon={Cpu} accent="cyan" trend={cpuTrend}
      />
      <RuntimeMetricTile
        label="Avg Memory" value={`${overall.avgMem.toFixed(0)}%`}
        hint={`${(projects.reduce((s, p) => s + p.metrics.memUsedMb, 0) / 1024).toFixed(1)} GB total`}
        icon={MemoryStick} accent="magenta" trend={memTrend}
      />
      <RuntimeMetricTile
        label="Requests / sec" value={overall.totalRps.toLocaleString()}
        hint="Live throughput"
        icon={Gauge} accent="gold" trend={rpsTrend}
      />
    </LuminaMetricGrid>
  );
}

function avg(a: number[]) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; }
function scaleSeries(a: number[], k: number) { return a.map((v) => v * k); }
function aggregateSeries(series: number[][]): number[] {
  const len = series.reduce((m, s) => Math.max(m, s.length), 0);
  if (!len) return [];
  const out: number[] = new Array(len).fill(0);
  for (let i = 0; i < len; i++) {
    let sum = 0, n = 0;
    for (const s of series) {
      const v = s[i + Math.max(0, s.length - len)];
      if (typeof v === "number") { sum += v; n += 1; }
    }
    out[i] = n ? sum / n : 0;
  }
  return out;
}