import { readJSON } from "@/lib/persistence";
import { getConfig } from "@/services/providerConfigService";
import { mockAllUsers } from "@/providers/auth/MockAuthProvider";

const PREFIX = "korelumina:v1:";

export interface NamespaceInfo { namespace: string; bytes: number; keys: number }
export interface SystemHealth {
  localStorageBytes: number;
  localStorageQuotaEstimate: number;
  namespaces: NamespaceInfo[];
  schemaVersions: Record<string, number>;
  providerConfig: ReturnType<typeof getConfig>;
  adminSeeded: boolean;
  totalUsers: number;
}

export function getSystemHealth(): SystemHealth {
  const namespaces = new Map<string, NamespaceInfo>();
  let total = 0;
  if (typeof window !== "undefined") {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      const v = window.localStorage.getItem(k) ?? "";
      const bytes = (k.length + v.length) * 2;
      total += bytes;
      const ns = k.slice(PREFIX.length).split(":")[0];
      const cur = namespaces.get(ns) ?? { namespace: ns, bytes: 0, keys: 0 };
      cur.bytes += bytes; cur.keys += 1;
      namespaces.set(ns, cur);
    }
  }
  const schema = readJSON<Record<string, number>>("__schema__", "all", {});
  // schema is stored per-namespace as separate keys; reconstruct list:
  const schemaVersions: Record<string, number> = {};
  if (typeof window !== "undefined") {
    const p = `${PREFIX}__schema__:`;
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(p)) continue;
      const ns = k.slice(p.length);
      try { schemaVersions[ns] = JSON.parse(window.localStorage.getItem(k) ?? "0"); } catch {}
    }
  }
  void schema;
  return {
    localStorageBytes: total,
    localStorageQuotaEstimate: 5 * 1024 * 1024,
    namespaces: Array.from(namespaces.values()).sort((a, b) => b.bytes - a.bytes),
    schemaVersions,
    providerConfig: getConfig(),
    adminSeeded: mockAllUsers().some((u) => u.email === "admin@lumina.app"),
    totalUsers: mockAllUsers().length,
  };
}