import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

export interface RuntimeMetricsResponse {
  ok: boolean;
  service: string;
  timestamp: number;

  process: {
    pid: number;
    uptimeMs: number;
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
      externalMb: number;
    };
  };

  system?: {
    memoryTotalMb: number;
  };

  totals: {
    eventClients: number;
    workspaceWatchers: number;
    runtimes: number;
    running: number;
    starting: number;
    exited: number;
    error: number;
  };

  restarts: Array<{
    projectId: string;
    count: number;
    windowStartedAt: number;
    lastRestartAt: number;
    lastRecoveredAt?: number;
    lastFailureReason?: string;
  }>;

  runtimes: Array<{
    projectId: string;
    framework: string | null;
    status: string;
    port: number | null;
    pid: number | null;
    url: string | null;
    alive: boolean;
    uptimeMs: number;
    startedAt: number | null;
    exitedAt: number | null;
    lastError: string | null;
    logLines: number;

    cpuPct?: number;
    rssMb?: number;
    systemMemoryMb?: number;

    scenario?:
      | "normal"
      | "idle"
      | "spike"
      | "outage"
      | "recover";}>;
}

export async function getRuntimeMetrics(): Promise<RuntimeMetricsResponse> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/metrics`,
    {
      headers:
        getRuntimeCallerHeaders(),
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "failed_to_get_runtime_metrics",
    );
  }

  return data as RuntimeMetricsResponse;
}
