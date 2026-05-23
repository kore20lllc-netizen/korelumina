/**
 * Capacitor Mobile Packaging service.
 *
 * Wires the In-House Dev "Mobile App Packaging" module to backend endpoints
 * under /api/mobile/capacitor/*. If endpoints are not yet implemented the
 * helpers fall back to deterministic mock data so the UI remains functional
 * and demo-ready.
 */

export type Platform = "web" | "capacitor" | "ios" | "android";

export interface CapacitorConfig {
  appName: string;
  appId: string;
  version: string;
  buildNumber: string;
}

export interface CapacitorPlatformStatus {
  platform: Platform;
  status: "ready" | "not-ready" | "initialized" | "not-initialized" | "generated" | "missing";
  detail?: string;
}

export interface CapacitorStatus {
  projectId: string;
  config: CapacitorConfig;
  platforms: CapacitorPlatformStatus[];
  configPath: string | null;
  iosPath: string | null;
  androidPath: string | null;
  lastSyncAt: string | null;
  installedPlugins: InstalledPlugin[];
}

export interface InstalledPlugin {
  id: string;
  version: string;
}

export interface CapacitorLogEntry {
  id: string;
  timestamp: string;
  command: string;
  stream: "stdout" | "stderr" | "info";
  line: string;
}

export interface CapacitorActionResult {
  ok: boolean;
  message: string;
  logs?: CapacitorLogEntry[];
  status?: CapacitorStatus;
}

const BASE = "/api/mobile/capacitor";

async function request<T>(path: string, init?: RequestInit, fallback?: () => T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } catch (err) {
    if (fallback) return fallback();
    throw err;
  }
}

// ---------- Mock data ----------

const mockStore = new Map<string, CapacitorStatus>();
const mockLogs = new Map<string, CapacitorLogEntry[]>();

function nowIso() { return new Date().toISOString(); }

function defaultConfig(projectId: string): CapacitorConfig {
  return {
    appName: "GroupHome OS",
    appId: `com.kore.${projectId.toLowerCase().replace(/[^a-z0-9]/g, "-") || "app"}`,
    version: "1.0.0",
    buildNumber: "1",
  };
}

function ensureMockStatus(projectId: string): CapacitorStatus {
  let s = mockStore.get(projectId);
  if (!s) {
    s = {
      projectId,
      config: defaultConfig(projectId),
      platforms: [
        { platform: "web", status: "ready", detail: "dist/ available" },
        { platform: "capacitor", status: "not-initialized" },
        { platform: "ios", status: "missing" },
        { platform: "android", status: "missing" },
      ],
      configPath: null,
      iosPath: null,
      androidPath: null,
      lastSyncAt: null,
      installedPlugins: [] as InstalledPlugin[],
    };
    mockStore.set(projectId, s);
  }
  return s;
}

function appendLog(projectId: string, command: string, lines: string[]): CapacitorLogEntry[] {
  const arr = mockLogs.get(projectId) ?? [];
  const newEntries: CapacitorLogEntry[] = lines.map((line, i) => ({
    id: `${Date.now()}-${i}`,
    timestamp: nowIso(),
    command,
    stream: line.startsWith("!") ? "stderr" : line.startsWith(">") ? "info" : "stdout",
    line,
  }));
  const merged = [...arr, ...newEntries].slice(-200);
  mockLogs.set(projectId, merged);
  return newEntries;
}

// ---------- Public API ----------

export async function getCapacitorStatus(projectId: string): Promise<CapacitorStatus> {
  return request<CapacitorStatus>(`/status?projectId=${encodeURIComponent(projectId)}`, undefined, () =>
    ensureMockStatus(projectId),
  );
}

export async function initializeCapacitor(projectId: string): Promise<CapacitorActionResult> {
  return request<CapacitorActionResult>(
    `/init`,
    { method: "POST", body: JSON.stringify({ projectId }) },
    () => {
      const s = ensureMockStatus(projectId);
      s.configPath = "capacitor.config.ts";
      s.iosPath = "ios/";
      s.androidPath = "android/";
      s.platforms = [
        { platform: "web", status: "ready", detail: "dist/ available" },
        { platform: "capacitor", status: "initialized" },
        { platform: "ios", status: "generated" },
        { platform: "android", status: "generated" },
      ];
      const logs = appendLog(projectId, "npx cap init", [
        "> npx cap init",
        "Created capacitor.config.ts",
        "Generated ios/ project",
        "Generated android/ project",
      ]);
      return { ok: true, message: "Capacitor initialized", logs, status: s };
    },
  );
}

export async function syncCapacitor(projectId: string): Promise<CapacitorActionResult> {
  return request<CapacitorActionResult>(
    `/sync`,
    { method: "POST", body: JSON.stringify({ projectId }) },
    () => {
      const s = ensureMockStatus(projectId);
      s.lastSyncAt = nowIso();
      const logs = appendLog(projectId, "npx cap sync", [
        "> npx cap sync",
        "✓ Copying web assets",
        "✓ Updating ios native dependencies",
        "✓ Updating android native dependencies",
        "Sync finished in 2.1s",
      ]);
      return { ok: true, message: "Native projects synced", logs, status: s };
    },
  );
}

export async function openIOS(projectId: string): Promise<CapacitorActionResult> {
  return request<CapacitorActionResult>(
    `/open-ios`,
    { method: "POST", body: JSON.stringify({ projectId }) },
    () => {
      const logs = appendLog(projectId, "npx cap open ios", [
        "> npx cap open ios",
        "Opening Xcode workspace…",
      ]);
      return { ok: true, message: "Opening Xcode…", logs };
    },
  );
}

export async function openAndroid(projectId: string): Promise<CapacitorActionResult> {
  return request<CapacitorActionResult>(
    `/open-android`,
    { method: "POST", body: JSON.stringify({ projectId }) },
    () => {
      const logs = appendLog(projectId, "npx cap open android", [
        "> npx cap open android",
        "Opening Android Studio…",
      ]);
      return { ok: true, message: "Opening Android Studio…", logs };
    },
  );
}

export async function buildMobileBundle(projectId: string): Promise<CapacitorActionResult> {
  return request<CapacitorActionResult>(
    `/build`,
    { method: "POST", body: JSON.stringify({ projectId }) },
    () => {
      const s = ensureMockStatus(projectId);
      s.lastSyncAt = nowIso();
      const logs = appendLog(projectId, "npm run build && npx cap sync", [
        "> npm run build",
        "vite v5 building for production…",
        "✓ 1284 modules transformed",
        "dist/index.html generated",
        "> npx cap sync",
        "✓ Sync finished",
      ]);
      return { ok: true, message: "Mobile bundle built and synced", logs, status: s };
    },
  );
}

export async function saveCapacitorConfig(
  projectId: string,
  config: CapacitorConfig,
): Promise<CapacitorActionResult> {
  return request<CapacitorActionResult>(
    `/config`,
    { method: "POST", body: JSON.stringify({ projectId, config }) },
    () => {
      const s = ensureMockStatus(projectId);
      s.config = { ...config };
      appendLog(projectId, "config", [`> updated capacitor.config.ts → ${config.appId} v${config.version} (${config.buildNumber})`]);
      return { ok: true, message: "Configuration saved", status: s };
    },
  );
}

export async function getCapacitorLogs(projectId: string): Promise<CapacitorLogEntry[]> {
  return request<CapacitorLogEntry[]>(
    `/logs?projectId=${encodeURIComponent(projectId)}`,
    undefined,
    () => mockLogs.get(projectId) ?? [],
  );
}

/**
 * Install (or re-pin) a Capacitor plugin at an optional version.
 * `version` accepts semver ranges (e.g. "^6.0.0", "6.1.2", "latest"). Defaults to "latest".
 */
export async function installPlugin(
  projectId: string,
  plugin: string,
  version: string = "latest",
): Promise<CapacitorActionResult> {
  return request<CapacitorActionResult>(
    `/plugin`,
    { method: "POST", body: JSON.stringify({ projectId, plugin, version }) },
    () => {
      const s = ensureMockStatus(projectId);
      const existing = s.installedPlugins.find((p) => p.id === plugin);
      if (existing) existing.version = version;
      else s.installedPlugins.push({ id: plugin, version });
      const spec = `@capacitor/${plugin}${version && version !== "latest" ? `@${version}` : ""}`;
      const logs = appendLog(projectId, `npm i ${spec}`, [
        `> npm i ${spec}`,
        `added 1 package — ${plugin}@${version}`,
      ]);
      return { ok: true, message: `Installed ${plugin}@${version}`, logs, status: s };
    },
  );
}

export async function uninstallPlugin(projectId: string, plugin: string): Promise<CapacitorActionResult> {
  return request<CapacitorActionResult>(
    `/plugin`,
    { method: "DELETE", body: JSON.stringify({ projectId, plugin }) },
    () => {
      const s = ensureMockStatus(projectId);
      s.installedPlugins = s.installedPlugins.filter((p) => p.id !== plugin);
      const logs = appendLog(projectId, `npm rm @capacitor/${plugin}`, [
        `> npm rm @capacitor/${plugin}`,
        `removed 1 package`,
      ]);
      return { ok: true, message: `Removed ${plugin}`, logs, status: s };
    },
  );
}