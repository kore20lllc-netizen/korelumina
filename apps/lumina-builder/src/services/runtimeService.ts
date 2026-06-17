const RUNTIME_API =
  import.meta.env.VITE_RUNTIME_API_URL || "http://localhost:4100";


const MANUAL_RUNTIME_STOP_PREFIX =
  "lumina:runtime-manual-stop:";

const manuallyStoppedRuntimes =
  new Set<string>();

function manualStopKey(
  projectId: string,
) {
  return `${MANUAL_RUNTIME_STOP_PREFIX}${projectId}`;
}

export function markRuntimeManuallyStopped(
  projectId: string,
) {
  manuallyStoppedRuntimes.add(projectId);
}

export function clearRuntimeManuallyStopped(
  projectId: string,
) {
  manuallyStoppedRuntimes.delete(projectId);

  try {
    localStorage.removeItem(
      manualStopKey(projectId),
    );
  } catch {
    // ignore
  }
}

export function isRuntimeManuallyStopped(
  projectId: string,
) {
  return manuallyStoppedRuntimes.has(projectId);
}

export interface RuntimeProject {
  projectId: string;
  path: string;
  hasPackageJson: boolean;
}

export interface RuntimeSession {
  projectId: string;
  framework?: string;
  port?: number;
  pid?: number;
  startedAt?: number;
  url: string;
  status?: string;
  logs?: string[];
}

export type RuntimeEvent =
  | {
      type: "runtime:log";
      projectId: string;
      line: string;
      timestamp: number;
    }
  | {
      type: "runtime:state";
      projectId: string;
      status: string;
      timestamp: number;
    }
  | {
      type: "runtime:error";
      projectId: string;
      error: string;
      timestamp: number;
    }
  | {
      type: "runtime:file-changed";
      projectId: string;
      file: string;
      sha256?: string;
      timestamp: number;
    };

export async function listRuntimeProjects(): Promise<RuntimeProject[]> {
  const response = await fetch(`${RUNTIME_API}/api/runtime/projects`);
  const data = await response.json();

  if (!response.ok || !data?.ok || !Array.isArray(data.projects)) {
    throw new Error(data?.error ?? "failed_to_list_runtime_projects");
  }

  return data.projects as RuntimeProject[];
}

function normalizeRuntimeUrl(
  url?: string | null,
) {
  if (!url?.trim()) {
    return "";
  }

  const trimmed =
    url.trim();

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  return `http://${trimmed}`;
}

function normalizeRuntimePayload(
  data: any,
): RuntimeSession | null {
  const runtime =
    data?.runtime ?? data;

  if (!runtime?.url) {
    return null;
  }

  return {
    ...runtime,
    url: normalizeRuntimeUrl(
      runtime.url,
    ),
  };
}

export async function getRuntimeStatus(
  projectId: string,
): Promise<RuntimeSession | null> {
  try {
    const response =
      await fetch(
        `${RUNTIME_API}/api/runtime/status?projectId=${encodeURIComponent(projectId)}`,
        {
          method: "GET",
        },
      );

    if (!response.ok) {
      return null;
    }

    const data =
      await response.json();

    return normalizeRuntimePayload(
      data,
    );
  } catch (error) {
    console.warn('[runtimeService] Failed to get runtime status:', error);
    return null;
  }
}

export async function getRuntime(
  projectId: string,
): Promise<RuntimeSession | null> {
  return getRuntimeStatus(
    projectId,
  );
}

export async function startRuntime(
  projectId: string,
): Promise<RuntimeSession> {
  clearRuntimeManuallyStopped(
    projectId,
  );

  try {
    const existing =
      await getRuntimeStatus(
        projectId,
      );

    if (existing?.url) {
      return existing;
    }

    const response =
      await fetch(
        `${RUNTIME_API}/api/runtime/start`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            projectId,
          }),
        },
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ??
          "Failed to start runtime",
      );
    }

    const runtime =
      normalizeRuntimePayload(
        data,
      );

    if (!runtime?.url) {
      throw new Error(
        "Runtime URL missing",
      );
    }

    return runtime;
  } catch (error) {
    console.error('[runtimeService] Failed to start runtime:', error);
    throw error;
  }
}

export async function stopRuntime(
  projectId: string,
): Promise<void> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/stop`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          projectId,
        }),
      },
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "Failed to stop runtime",
    );
  }

  markRuntimeManuallyStopped(
    projectId,
  );
}


export async function deleteRuntimeProject(
  projectId: string,
): Promise<void> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/projects/${encodeURIComponent(
        projectId,
      )}`,
      {
        method: "DELETE",
      },
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "failed_to_delete_project",
    );
  }
}



export async function restartRuntime(
  projectId: string,
): Promise<RuntimeSession> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/restart`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          projectId,
        }),
      },
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "Failed to restart runtime",
    );
  }

  const runtime =
    normalizeRuntimePayload(
      data,
    );

  if (!runtime?.url) {
    throw new Error(
      "Runtime URL missing",
    );
  }

  return runtime;
}


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
  }>;
}

export async function getRuntimeMetrics(): Promise<RuntimeMetricsResponse> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/metrics`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
      "failed_to_get_runtime_metrics",
    );
  }

  return data as RuntimeMetricsResponse;
}

export async function getRuntimeLogs(
  projectId: string,
) {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/logs?projectId=${encodeURIComponent(projectId)}`,
    );

  if (!response.ok) {
    return [];
  }

  const data =
    await response.json();

  return Array.isArray(
    data?.logs,
  )
    ? data.logs
    : [];
}

export async function getActiveRuntime(): Promise<RuntimeSession | null> {
  const projectId =
    localStorage.getItem(
      "lumina:last-runtime-project",
    );

  if (!projectId) {
    return null;
  }

  return getRuntimeStatus(
    projectId,
  );
}

export function connectRuntimeEvents(
  onEvent: (
    event: RuntimeEvent,
  ) => void,
  onError?: (
    error: Event,
  ) => void,
) {
  const source =
    new EventSource(
      `${RUNTIME_API}/api/runtime/events`,
    );

  const handleEvent =
    (
      raw: MessageEvent,
    ) => {
      try {
        const parsed =
          JSON.parse(
            raw.data,
          ) as RuntimeEvent & {
            message?: string;
            state?: string;
          };

        const event =
          parsed.type === "runtime:log"
            ? {
                ...parsed,
                line:
                  parsed.line ??
                  parsed.message ??
                  "",
              }
            : parsed.type === "runtime:state"
              ? {
                  ...parsed,
                  status:
                    parsed.status ??
                    parsed.state ??
                    "unknown",
                }
              : parsed;

        onEvent(
          event as RuntimeEvent,
        );
      } catch {
        // ignore malformed event payloads
      }
    };

  source.addEventListener(
    "runtime:log",
    handleEvent,
  );

  source.addEventListener(
    "runtime:state",
    handleEvent,
  );

  source.addEventListener(
    "runtime:error",
    handleEvent,
  );

  source.addEventListener(
    "runtime:file-changed",
    handleEvent,
  );

  source.onerror =
    (
      error,
    ) => {
      onError?.(
        error,
      );
    };

  return () => {
    source.close();
  };
}

export interface RuntimeFileListResponse {
  ok: boolean;
  projectId: string;
  files: string[];
  error?: string;
}

export interface RuntimeFileReadResponse {
  ok: boolean;
  projectId: string;
  file: string;
  content: string;
  sha256: string;
  error?: string;
}

export interface RuntimeFileWriteResponse {
  ok: boolean;
  projectId: string;
  file: string;
  sha256?: string;
  currentSha256?: string;
  error?: string;
}

export async function listRuntimeFiles(projectId: string): Promise<string[]> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/fs/list?projectId=${encodeURIComponent(projectId)}`,
  );

  const data = (await response.json()) as RuntimeFileListResponse;

  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "failed_to_list_files");
  }

  return Array.isArray(data.files) ? data.files : [];
}

export async function readRuntimeFile(
  projectId: string,
  file: string,
): Promise<RuntimeFileReadResponse> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/fs/read?projectId=${encodeURIComponent(projectId)}&file=${encodeURIComponent(file)}`,
  );

  const data = (await response.json()) as RuntimeFileReadResponse;

  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "failed_to_read_file");
  }

  return data;
}

export async function writeRuntimeFile(input: {
  projectId: string;
  file: string;
  content: string;
  expectedSha256?: string;
}): Promise<RuntimeFileWriteResponse> {
  const response = await fetch(`${RUNTIME_API}/api/runtime/fs/write`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as RuntimeFileWriteResponse;

  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "failed_to_write_file");
  }

  return data;
}
