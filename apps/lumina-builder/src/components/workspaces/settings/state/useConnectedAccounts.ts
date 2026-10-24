import { useCallback, useEffect, useState } from "react";

import {
  disconnectAccount,
  getConnectionUses,
  getConnections,
  startConnection,
  takeConnectionReturn,
  type ConnectionProviderId,
  type ConnectionUse,
  type ConnectionsOverview,
} from "@/services/runtime/connections";

/* MS-2026-0016: Settings' view of the person's connected accounts, all read from Runtime. */

export type Load<T> = { status: "loading" } | { status: "ok"; data: T } | { status: "error"; code: string };

export function useConnectedAccounts() {
  const [overview, setOverview] = useState<Load<ConnectionsOverview>>({ status: "loading" });
  const [uses, setUses] = useState<ConnectionUse[]>([]);
  const [busy, setBusy] = useState<ConnectionProviderId | null>(null);
  const [notice, setNotice] = useState<{ tone: "healthy" | "warning" | "error"; text: string; link?: string } | null>(null);
  const [returned] = useState(() => takeConnectionReturn());

  const refresh = useCallback(async () => {
    try {
      const data = await getConnections();
      setOverview({ status: "ok", data });
      setUses(await getConnectionUses().catch(() => []));
    } catch (error) {
      setOverview({ status: "error", code: error instanceof Error ? error.message : "connections_unavailable" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!returned) return;
    const name = returned.provider === "github" ? "GitHub" : returned.provider === "supabase" ? "Supabase" : returned.provider === "vercel" ? "Vercel" : "The account";
    if (returned.result === "connected") setNotice({ tone: "healthy", text: `${name} is connected. KoreLumina uses it only when you ask it to.` });
    else if (returned.result === "connection_declined") setNotice({ tone: "warning", text: `${name} was not connected: access was not granted.` });
    else if (returned.result === "connection_state_invalid") setNotice({ tone: "error", text: `${name} was not connected: the sign-in took too long or was opened twice. Try again.` });
    else setNotice({ tone: "error", text: `${name} was not connected (${returned.result.replace(/_/g, " ")}). Try again.` });
  }, [returned]);

  const connect = useCallback(async (provider: ConnectionProviderId) => {
    setBusy(provider);
    setNotice(null);
    try {
      window.location.assign(await startConnection(provider));
    } catch (error) {
      setBusy(null);
      const code = error instanceof Error ? error.message : "connection_failed";
      setNotice({
        tone: "error",
        text: code.startsWith("provider_not_configured")
          ? "This provider is not set up on KoreLumina yet."
          : code === "connections_key_missing"
            ? "Connected accounts are not switched on yet."
            : "The connection could not start. Try again.",
      });
    }
  }, []);

  const disconnect = useCallback(
    async (provider: ConnectionProviderId, label: string) => {
      setBusy(provider);
      setNotice(null);
      try {
        const result = await disconnectAccount(provider);
        setNotice(
          result.revokedAtProvider
            ? { tone: "healthy", text: `${label} is disconnected, and its access to your account was withdrawn.` }
            : {
                tone: "warning",
                text: `${label} is disconnected from KoreLumina. To withdraw the access on ${label}'s side too, open its settings.`,
                link: result.manageUrl ?? undefined,
              },
        );
      } catch {
        setNotice({ tone: "error", text: `${label} could not be disconnected. Try again.` });
      } finally {
        setBusy(null);
        await refresh();
      }
    },
    [refresh],
  );

  return { overview, uses, busy, notice, connect, disconnect, refresh };
}

export type ConnectedAccounts = ReturnType<typeof useConnectedAccounts>;
