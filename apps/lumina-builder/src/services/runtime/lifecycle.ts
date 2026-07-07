import {
  clearRuntimeManuallyStopped,
  markRuntimeManuallyStopped,
} from "@/services/runtime/manualStop";

import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

import type {
  RuntimeSession,
} from "@/services/runtimeService";

function normalizeRuntimeUrl(
  url?: string | null,
) {
  if (!url?.trim()) {
    return "";
  }

  const trimmed = url.trim();

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
    url: normalizeRuntimeUrl(runtime.url),
  };
}

export async function getRuntimeStatus(
  projectId: string,
): Promise<RuntimeSession | null> {
  try {
    const response = await fetch(
      `${RUNTIME_API}/api/runtime/status?projectId=${encodeURIComponent(projectId)}`,
      {
        method: "GET",
        headers: getRuntimeCallerHeaders(),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return normalizeRuntimePayload(data);
  } catch (error) {
    console.warn("[runtimeService] Failed to get runtime status:", error);
    return null;
  }
}

export async function getRuntime(
  projectId: string,
): Promise<RuntimeSession | null> {
  return getRuntimeStatus(projectId);
}

export async function startRuntime(
  projectId: string,
): Promise<RuntimeSession> {
  clearRuntimeManuallyStopped(projectId);

  const existing =
    await getRuntimeStatus(projectId);

  if (existing?.url) {
    return existing;
  }

  const response = await fetch(
    `${RUNTIME_API}/api/runtime/start`,
    {
      method: "POST",
      headers: getRuntimeCallerHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        projectId,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
      "Failed to start runtime",
    );
  }

  const runtime =
    normalizeRuntimePayload(data);

  if (!runtime?.url) {
    throw new Error(
      "Runtime URL missing",
    );
  }

  return runtime;
}

export async function stopRuntime(
  projectId: string,
): Promise<void> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/stop`,
    {
      method: "POST",
      headers: getRuntimeCallerHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        projectId,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
      "Failed to stop runtime",
    );
  }

  markRuntimeManuallyStopped(projectId);
}

export async function restartRuntime(
  projectId: string,
): Promise<RuntimeSession> {
  const response = await fetch(
    `${RUNTIME_API}/api/runtime/restart`,
    {
      method: "POST",
      headers: getRuntimeCallerHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        projectId,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
      "Failed to restart runtime",
    );
  }

  const runtime =
    normalizeRuntimePayload(data);

  if (!runtime?.url) {
    throw new Error(
      "Runtime URL missing",
    );
  }

  return runtime;
}
