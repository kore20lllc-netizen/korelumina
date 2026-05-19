/**
 * Namespaced, versioned, corruption-resilient localStorage wrapper.
 * Every Mock provider and service persists state through this utility.
 */

const PREFIX = "korelumina:v1:";

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

// Cross-tab sync via BroadcastChannel (fallback to `storage` event subscription).
let channel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    channel = new BroadcastChannel("korelumina:v1");
    channel.addEventListener("message", (e: MessageEvent) => {
      const ns = (e.data as { namespace?: string } | null)?.namespace;
      if (ns) listeners.get(ns)?.forEach((cb) => { try { cb(); } catch {} });
    });
  } catch { channel = null; }
}

function fullKey(namespace: string, key: string) {
  return `${PREFIX}${namespace}:${key}`;
}

export function readJSON<T>(namespace: string, key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(fullKey(namespace, key));
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupted entry — drop and return fallback.
    try { window.localStorage.removeItem(fullKey(namespace, key)); } catch {}
    return fallback;
  }
}

export function writeJSON<T>(namespace: string, key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(fullKey(namespace, key), JSON.stringify(value));
    notify(namespace);
  } catch {
    // Quota or serialization error — best effort, swallow.
  }
}

export function removeKey(namespace: string, key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(fullKey(namespace, key));
    notify(namespace);
  } catch {}
}

export function clearNamespace(namespace: string): void {
  if (typeof window === "undefined") return;
  try {
    const prefix = `${PREFIX}${namespace}:`;
    const toDel: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) toDel.push(k);
    }
    toDel.forEach((k) => window.localStorage.removeItem(k));
    notify(namespace);
  } catch {}
}

export function subscribe(namespace: string, cb: Listener): () => void {
  let set = listeners.get(namespace);
  if (!set) { set = new Set(); listeners.set(namespace, set); }
  set.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key && e.key.startsWith(`${PREFIX}${namespace}:`)) cb();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    set?.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function notify(namespace: string) {
  listeners.get(namespace)?.forEach((cb) => { try { cb(); } catch {} });
  if (channel) { try { channel.postMessage({ namespace }); } catch {} }
}

/** Run a one-time migration keyed by namespace + version. */
export function migrate(namespace: string, version: number, fn: () => void): void {
  const cur = readJSON<number>("__schema__", namespace, 0);
  if (cur < version) {
    try { fn(); } catch {}
    writeJSON("__schema__", namespace, version);
  }
}

/**
 * Schema migration registry. Register ordered migrations per namespace and
 * call runMigrations() once on boot; each migration runs at most once and the
 * schema version is persisted in the __schema__ namespace.
 */
type Migration = { version: number; up: () => void };
const migrationRegistry = new Map<string, Migration[]>();

export function registerMigration(namespace: string, version: number, up: () => void) {
  const list = migrationRegistry.get(namespace) ?? [];
  if (list.some((m) => m.version === version)) return;
  list.push({ version, up });
  list.sort((a, b) => a.version - b.version);
  migrationRegistry.set(namespace, list);
}

export function runMigrations(): void {
  for (const [ns, list] of migrationRegistry.entries()) {
    const cur = readJSON<number>("__schema__", ns, 0);
    for (const m of list) {
      if (m.version > cur) {
        try { m.up(); } catch {}
        writeJSON("__schema__", ns, m.version);
      }
    }
  }
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}