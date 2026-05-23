import { readJSON, writeJSON, subscribe } from "@/lib/persistence";

const NS = "providerConfig";

export type ProviderKey = "auth" | "billing" | "ai" | "repo" | "deploy" | "storage" | "usage";
export type ProviderMode = "mock" | "real";

export type ProviderConfig = Record<ProviderKey, ProviderMode>;

const DEFAULT: ProviderConfig = {
  auth: "mock", billing: "mock", ai: "mock", repo: "mock",
  deploy: "mock", storage: "mock", usage: "mock",
};

export function getConfig(): ProviderConfig {
  return { ...DEFAULT, ...readJSON<Partial<ProviderConfig>>(NS, "config", {}) };
}

export function setConfig(patch: Partial<ProviderConfig>) {
  writeJSON(NS, "config", { ...getConfig(), ...patch });
  // Mirror into the runtime registry hook so a reload picks it up.
  if (typeof window !== "undefined") {
    window.__PROVIDERS__ = { ...(window.__PROVIDERS__ ?? {}), ...patch };
  }
}

export function resetConfig() {
  writeJSON(NS, "config", DEFAULT);
  if (typeof window !== "undefined") window.__PROVIDERS__ = { ...DEFAULT };
}

export function onConfigChange(cb: () => void) { return subscribe(NS, cb); }

// Apply persisted config to runtime hint on boot.
export function applyConfigToRuntime() {
  if (typeof window === "undefined") return;
  window.__PROVIDERS__ = { ...(window.__PROVIDERS__ ?? {}), ...getConfig() };
}