import { RUNTIME_API } from "./client";

/*
 * UI-1: the Runtime computes education, certification, and Genesis
 * projections from scratch on every request (about 12 s each, CPU-bound).
 * While one runs, the Runtime cannot answer anything else, including
 * /health. When several panels asked at once, requests queued for minutes
 * and timed out, and a healthy Runtime looked offline.
 *
 * These slow reads now go through one queue: one at a time, identical
 * requests share one answer, and a successful answer is reused for a short
 * time. Writes pass straight through and clear the reuse cache so the next
 * read is fresh.
 */

const SLOW_PATHS = [
  /^\/api\/knowledge\/education(\/|$|\?)/,
  /^\/api\/runtime\/genesis\//,
  /^\/api\/executive\/activation\?.*prerequisites=true/,
];

const REUSE_MS = 120_000;

type Entry = {
  startedAt: number;
  response: Promise<Response>;
};

const entries = new Map<string, Entry>();
let queue: Promise<unknown> = Promise.resolve();

export function isSlowRuntimeRead(url: string): boolean {
  const path = url.startsWith(RUNTIME_API)
    ? url.slice(RUNTIME_API.length)
    : url;
  return SLOW_PATHS.some((pattern) => pattern.test(path));
}

export function clearRuntimeReadCache() {
  entries.clear();
}

export function runtimeRead(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();

  if (method !== "GET") {
    clearRuntimeReadCache();
    return fetch(url, init);
  }

  if (!isSlowRuntimeRead(url)) {
    return fetch(url, init);
  }

  const existing = entries.get(url);
  if (existing && Date.now() - existing.startedAt < REUSE_MS) {
    return existing.response.then((response) => response.clone());
  }

  /*
   * A shared request must not be cancelled by one caller's timeout,
   * so the caller's abort signal is not passed on.
   */
  const { signal: _signal, ...shared } = init;

  const response = queue.then(() =>
    fetch(url, { ...shared, cache: "no-store" }),
  );

  queue = response.catch(() => undefined);

  const entry: Entry = { startedAt: Date.now(), response };
  entries.set(url, entry);

  response.then(
    (answer) => {
      if (!answer.ok && entries.get(url) === entry) entries.delete(url);
      else if (entries.get(url) === entry) entry.startedAt = Date.now();
    },
    () => {
      if (entries.get(url) === entry) entries.delete(url);
    },
  );

  return response.then((answer) => answer.clone());
}
