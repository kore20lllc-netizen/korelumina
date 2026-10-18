import { useSyncExternalStore } from "react";
import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";
import {
  isSlowRuntimeRead,
  runtimeRead,
} from "@/services/runtime/runtimeReadQueue";

/*
 * UI-1: one shared, read-only view of real Runtime state for the Knowledge
 * Operations header. Every value shown in the Operational Heartbeat and the
 * header tiles comes from here; nothing is typed in. A value that has not
 * been checked yet is "loading", and a failed check is "error" — never a
 * guessed healthy state.
 */

export type Checked<T> =
  | { status: "loading" }
  /* stale: the latest re-check failed; data is from the last good check. */
  | { status: "ok"; data: T; stale?: string }
  | { status: "error"; message: string };

export interface KnowledgeOperationsTruth {
  runtime: Checked<true>;
  overview: Checked<{
    canonicalItems: number;
    evidenceTotal: number;
  }>;
  dayZero: Checked<{ state: string }>;
  corpusCertification: Checked<{ state: string }>;
  competencyCertification: Checked<{ state: string }>;
  modules: Checked<{
    complete: number;
    total: number;
    corpusItems: number;
  }>;
  activation: Checked<{
    state: string;
    autonomyLevel: string | null;
    decisions: number;
  }>;
  checkedAt: number | null;
}

/*
 * Quick checks (health, overview, activation record) every minute.
 * Slow projections (education, certifications, Genesis) every 10 minutes,
 * through the shared read queue, so the header never overloads the Runtime.
 */
const QUICK_POLL_MS = 60_000;
const SLOW_POLL_MS = 600_000;
const QUICK_TIMEOUT_MS = 90_000;

const initial: KnowledgeOperationsTruth = {
  runtime: { status: "loading" },
  overview: { status: "loading" },
  dayZero: { status: "loading" },
  corpusCertification: { status: "loading" },
  competencyCertification: { status: "loading" },
  modules: { status: "loading" },
  activation: { status: "loading" },
  checkedAt: null,
};

let snapshot: KnowledgeOperationsTruth = initial;
const listeners = new Set<() => void>();
let quickTimer: ReturnType<typeof setInterval> | null = null;
let slowTimer: ReturnType<typeof setInterval> | null = null;

function publish(
  patch: Partial<KnowledgeOperationsTruth>,
) {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) listener();
}

async function getJson(path: string): Promise<any> {
  const url = `${RUNTIME_API}${path}`;
  const init: RequestInit = {
    method: "GET",
    cache: "no-store",
    headers: getRuntimeCallerHeaders(),
  };

  if (isSlowRuntimeRead(url)) {
    const response = await runtimeRead(url, init);
    if (!response.ok) throw new Error(`${path} answered ${response.status}`);
    return await response.json();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUICK_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`${path} answered ${response.status}`);
    return await response.json();
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("no answer within 90 s (Runtime busy or stopped)");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function check<K extends keyof KnowledgeOperationsTruth>(
  key: K,
  load: () => Promise<any>,
) {
  return load().then(
    (data) => publish({ [key]: { status: "ok", data } } as never),
    (error) => {
      const message = error instanceof Error ? error.message : String(error);
      const previous = snapshot[key] as Checked<unknown>;
      publish({
        [key]:
          previous && typeof previous === "object" && previous.status === "ok"
            ? { ...previous, stale: message }
            : { status: "error", message },
      } as never);
    },
  );
}

let quickInFlight = false;
let slowInFlight = false;

async function refreshQuick() {
  if (quickInFlight) return;
  quickInFlight = true;
  try {
    await Promise.allSettled([
      check("runtime", async () => {
        const body = await getJson("/health");
        if (body?.ok !== true) throw new Error("health check did not answer ok");
        return true;
      }),
      check("overview", async () => {
        const body = await getJson("/api/knowledge/operations");
        return {
          canonicalItems: Number(body?.knowledge?.canonicalItems ?? 0),
          evidenceTotal: Number(body?.evidence?.total ?? 0),
        };
      }),
      check("activation", async () => {
        const body = await getJson("/api/executive/activation");
        return {
          state: String(body?.activation?.state ?? "UNAVAILABLE"),
          autonomyLevel: body?.activation?.autonomyLevel ?? null,
          decisions: Array.isArray(body?.history) ? body.history.length : 0,
        };
      }),
    ]);
    publish({ checkedAt: Date.now() });
  } finally {
    quickInFlight = false;
  }
}

async function refreshSlow() {
  if (slowInFlight) return;
  slowInFlight = true;
  try {
    /* The queue runs these one at a time. */
    await Promise.allSettled([
      check("modules", async () => {
        const body = await getJson("/api/knowledge/education");
        const modules: Array<{ completion?: number }> = Array.isArray(body?.modules) ? body.modules : [];
        return {
          complete: modules.filter((m) => Number(m.completion) >= 100).length,
          total: modules.length,
          corpusItems: Array.isArray(body?.artifacts) ? body.artifacts.length : 0,
        };
      }),
      check("corpusCertification", async () => {
        const body = await getJson("/api/knowledge/education/corpus-certification");
        return { state: String(body?.projection?.state ?? "UNKNOWN") };
      }),
      check("competencyCertification", async () => {
        const body = await getJson("/api/knowledge/education/initial-competency/certification");
        return { state: String(body?.projection?.state ?? "UNKNOWN") };
      }),
      check("dayZero", async () => {
        const body = await getJson("/api/runtime/genesis/day-zero-certification");
        return { state: String(body?.projection?.state ?? "UNKNOWN") };
      }),
    ]);
    publish({ checkedAt: Date.now() });
  } finally {
    slowInFlight = false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshQuick();
    void refreshSlow();
    quickTimer = setInterval(() => void refreshQuick(), QUICK_POLL_MS);
    slowTimer = setInterval(() => void refreshSlow(), SLOW_POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (quickTimer) clearInterval(quickTimer);
      if (slowTimer) clearInterval(slowTimer);
      quickTimer = null;
      slowTimer = null;
    }
  };
}

export function useKnowledgeOperationsTruth(): KnowledgeOperationsTruth {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
}
