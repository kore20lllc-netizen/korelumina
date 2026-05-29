const RUNTIME_API =
  "http://localhost:4100";

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

  source.onmessage =
    (
      raw,
    ) => {
      try {
        const event =
          JSON.parse(
            raw.data,
          ) as RuntimeEvent;

        onEvent(
          event,
        );
      } catch {
        // ignore malformed event payloads
      }
    };

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

export interface RuntimeFileRead {
  ok?: boolean;
  projectId?: string;
  file: string;
  content: string;
  sha256?: string;
}

export async function readRuntimeFile(
  projectId: string,
  file: string,
): Promise<RuntimeFileRead> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/fs/read?projectId=${encodeURIComponent(projectId)}&file=${encodeURIComponent(file)}`,
    );

  const data =
    await response.json();

  if (!response.ok || !data?.ok) {
    throw new Error(
      data?.error ??
        "Failed to read runtime file",
    );
  }

  return data as RuntimeFileRead;
}

export async function writeRuntimeFile(
  projectId: string,
  file: string,
  content: string,
  expectedSha256?: string,
): Promise<{
  ok: true;
  projectId: string;
  file: string;
  sha256: string;
}> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/fs/write`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          projectId,
          file,
          content,
          expectedSha256,
        }),
      },
    );

  const data =
    await response.json();

  if (!response.ok || !data?.ok) {
    throw new Error(
      data?.error ??
        "Failed to write runtime file",
    );
  }

  return data;
}
