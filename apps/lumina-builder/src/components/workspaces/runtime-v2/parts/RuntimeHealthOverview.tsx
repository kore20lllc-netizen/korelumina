import {
  Activity,
  Cpu,
  Gauge,
  MemoryStick,
} from "lucide-react";

import {
  LuminaMetricGrid,
} from "@/components/lumina/workspace";

import type {
  RuntimeOverall,
  RuntimeProject,
} from "@/services/runtime/types";

import {
  RuntimeMetricTile,
} from "./RuntimeMetricTile";

export interface RuntimeHealthOverviewProps {
  overall: RuntimeOverall;
  projects: RuntimeProject[];
}

function average(
  values: number[],
): number {
  if (!values.length) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) => sum + value,
      0,
    ) / values.length
  );
}

function aggregateSeries(
  series: number[][],
): number[] {
  const length =
    series.reduce(
      (maximum, current) =>
        Math.max(
          maximum,
          current.length,
        ),
      0,
    );

  if (!length) {
    return [];
  }

  const output =
    new Array<number>(length).fill(0);

  for (
    let index = 0;
    index < length;
    index += 1
  ) {
    let total = 0;
    let count = 0;

    for (const current of series) {
      const offset = Math.max(
        0,
        current.length - length,
      );

      const value =
        current[index + offset];

      if (typeof value === "number") {
        total += value;
        count += 1;
      }
    }

    output[index] =
      count ? total / count : 0;
  }

  return output;
}

function createHealthTrend(
  cpuTrend: number[],
  memoryTrend: number[],
  score: number,
): number[] {
  const combined =
    aggregateSeries([
      cpuTrend,
      memoryTrend,
    ]);

  if (!combined.length) {
    return [score, score];
  }

  return combined.map(
    (value) =>
      Math.max(
        0,
        Math.min(
          100,
          score - value * 0.08,
        ),
      ),
  );
}

function createRpsTrend(
  projects: RuntimeProject[],
): number[] {
  const scaled =
    projects.map((project) => {
      const cpuAverage =
        average(
          project.metrics.cpuSeries,
        );

      const scale =
        project.metrics.rps /
        Math.max(
          1,
          cpuAverage,
        );

      return project.metrics.cpuSeries.map(
        (value) => value * scale,
      );
    });

  return aggregateSeries(scaled);
}

export function RuntimeHealthOverview({
  overall,
  projects,
}: RuntimeHealthOverviewProps) {
  const cpuTrend =
    aggregateSeries(
      projects.map(
        (project) =>
          project.metrics.cpuSeries,
      ),
    );

  const memoryTrend =
    aggregateSeries(
      projects.map(
        (project) =>
          project.metrics.memSeries,
      ),
    );

  const rpsTrend =
    createRpsTrend(projects);

  const healthTrend =
    createHealthTrend(
      cpuTrend,
      memoryTrend,
      overall.health.score,
    );

  const totalMemoryGb =
    projects.reduce(
      (sum, project) =>
        sum +
        project.metrics.memUsedMb,
      0,
    ) / 1024;

  return (
    <LuminaMetricGrid>
      <RuntimeMetricTile
        label="Global Health"
        value={`${overall.health.score}`}
        footer={
          <div className="text-[11px] text-muted-foreground">
            {overall.running}/{overall.total} running
          </div>
        }
        icon={Activity}
        accent="violet"
        visualization="health"
        trend={healthTrend}
      />

      <RuntimeMetricTile
        label="Avg CPU"
        value={`${overall.avgCpu.toFixed(0)}%`}
        footer={
          <div className="text-[11px] text-muted-foreground">
            {overall.total} services
          </div>
        }
        icon={Cpu}
        accent="cyan"
        visualization="cpu"
        trend={cpuTrend}
      />

      <RuntimeMetricTile
        label="Avg Memory"
        value={`${overall.avgMem.toFixed(0)}%`}
        footer={
          <div className="text-[11px] text-muted-foreground">
            {totalMemoryGb.toFixed(1)} GB total
          </div>
        }
        icon={MemoryStick}
        accent="magenta"
        visualization="memory"
        trend={memoryTrend}
      />

      <RuntimeMetricTile
        label="Requests / sec"
        value={overall.totalRps.toLocaleString()}
        footer={
          <div className="text-[11px] text-muted-foreground">
            Live throughput
          </div>
        }
        icon={Gauge}
        accent="gold"
        visualization="throughput"
        trend={rpsTrend}
      />
    </LuminaMetricGrid>
  );
}

export default RuntimeHealthOverview;
