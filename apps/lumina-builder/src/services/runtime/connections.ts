import { RUNTIME_API, getRuntimeCallerHeaders } from "@/services/runtime/client";

/* MS-2026-0016: the person's connected GitHub, Supabase and Vercel accounts. Never a token. */

export type ConnectionProviderId = "github" | "supabase" | "vercel";

export interface PublicConnection {
  provider: ConnectionProviderId;
  status: "connected" | "disconnected";
  account: { id: string; login: string; name: string | null; teamId: string | null; installationId: string | null };
  connectedAt: number;
  updatedAt: number;
  expiresAt: number | null;
  disconnectedReason: string | null;
}

export interface ConnectionsOverview {
  storeReady: boolean;
  providers: Record<ConnectionProviderId, boolean>;
  connections: Array<{
    provider: ConnectionProviderId;
    label: string;
    configured: boolean;
    connection: PublicConnection | null;
    manageUrl: string | null;
  }>;
}

export interface ConnectionUse {
  at: number;
  provider: ConnectionProviderId;
  projectId: string | null;
  action: string;
  outcome: "used" | "refreshed" | "refused" | "disconnected";
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${RUNTIME_API}${path}`, { ...init, headers: getRuntimeCallerHeaders() });
  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }
  if (!response.ok || data.ok === false) throw new Error(typeof data.error === "string" ? data.error : "connections_unavailable");
  return data as T;
}

export const getConnections = () => call<ConnectionsOverview>("/api/connections");
export const getConnectionUses = () => call<{ uses: ConnectionUse[] }>("/api/connections/uses").then((data) => data.uses);
export const startConnection = (provider: ConnectionProviderId) =>
  call<{ url: string }>(`/api/connections/${provider}/start`, { method: "POST" }).then((data) => data.url);
export const disconnectAccount = (provider: ConnectionProviderId) =>
  call<{ revokedAtProvider: boolean; manageUrl: string | null }>(`/api/connections/${provider}`, { method: "DELETE" });

/*
 * The provider sends the person back to the Builder with
 * ?connection=<provider>&connection_result=<code>. The result is kept for
 * Settings to show once, and removed from the address.
 */
const RETURN_KEY = "korelumina:connection-return";
const OPEN_KEY = "korelumina:connection-return-open";

/* Settings opens on Connected accounts once after a provider sends the person back. */
export function takeConnectionReturnOpen(): boolean {
  try {
    const open = sessionStorage.getItem(OPEN_KEY) === "1";
    sessionStorage.removeItem(OPEN_KEY);
    return open;
  } catch {
    return false;
  }
}

export function captureConnectionReturn(): { provider: string; result: string } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const provider = params.get("connection");
  const result = params.get("connection_result");
  if (!provider || !result) return null;
  params.delete("connection");
  params.delete("connection_result");
  const rest = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify({ provider, result }));
    sessionStorage.setItem(OPEN_KEY, "1");
  } catch {
    /* The banner is a convenience; Settings still shows the connection itself. */
  }
  return { provider, result };
}

export function takeConnectionReturn(): { provider: string; result: string } | null {
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    return raw ? (JSON.parse(raw) as { provider: string; result: string }) : null;
  } catch {
    return null;
  }
}
