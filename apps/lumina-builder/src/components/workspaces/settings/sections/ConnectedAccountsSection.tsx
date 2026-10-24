import { Database, ExternalLink, GitBranch, Globe, Link2, Unplug } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ConnectionProviderId } from "@/services/runtime/connections";

import { tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { panelEyebrow, pillButton, quietButton } from "../../developer/shared/surfaces";
import type { ConnectedAccounts } from "../state/useConnectedAccounts";
import { SettingsPanel } from "../shared/SettingsPanel";

/*
 * MS-2026-0016 (ADR-0047): the person's own GitHub, Supabase and Vercel,
 * connected with one click each. Everything shown is what Runtime holds:
 * whose account, since when, and every use. No token ever reaches here.
 */

const PURPOSE: Record<ConnectionProviderId, { title: string; detail: string; icon: typeof GitBranch }> = {
  github: { title: "Your code", detail: "Save your projects to your own GitHub, as new private repositories or pull requests.", icon: GitBranch },
  supabase: { title: "Your database", detail: "Create and set up databases in your own Supabase organisation.", icon: Database },
  vercel: { title: "Your website", detail: "Publish your projects on your own Vercel account.", icon: Globe },
};

const ACTION: Record<string, string> = {
  connect: "Connected",
  disconnect: "Disconnected",
  export: "Saved a project",
  push: "Pushed changes",
  "pull-request": "Opened a pull request",
  deploy: "Published",
};

function when(at: number): string {
  return new Date(at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function ConnectedAccountsSection({ accounts, isAdmin }: { accounts: ConnectedAccounts; isAdmin: boolean }) {
  const overview = accounts.overview;
  return (
    <SettingsPanel
      icon={Link2}
      eyebrow="Connected accounts"
      title="Everything stays in your own accounts"
      description="Your code, database and website live in accounts you own. KoreLumina only gets the access you grant here, uses it only when you ask, and you can take it back at any time, here or on the provider's site."
    >
      {accounts.notice ? (
        <div className={cn("rounded-2xl border px-4 py-3 text-sm", tonePill[accounts.notice.tone])}>
          {accounts.notice.text}{" "}
          {accounts.notice.link ? (
            <a href={accounts.notice.link} target="_blank" rel="noreferrer" className="underline">
              Open settings
            </a>
          ) : null}
        </div>
      ) : null}

      {overview.status === "loading" ? <p className="text-sm text-sky-300/70">Reading your connections…</p> : null}
      {overview.status === "error" ? (
        <p className={cn("text-sm", toneText.error)}>{overview.code === "authentication_required" ? "Sign in to connect your accounts." : "Runtime did not answer. Try again in a moment."}</p>
      ) : null}
      {overview.status === "ok" && !overview.data.storeReady ? (
        <p className={cn("rounded-2xl border px-4 py-3 text-sm", tonePill.warning)}>
          Connected accounts are not switched on for this KoreLumina yet.
          {isAdmin ? " Runtime needs KORELUMINA_CONNECTIONS_KEY (32 random bytes, base64) in its environment." : ""}
        </p>
      ) : null}

      {overview.status === "ok" ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {overview.data.connections.map((item) => {
            const purpose = PURPOSE[item.provider];
            const Icon = purpose.icon;
            const connection = item.connection;
            const connected = connection?.status === "connected";
            const usable = overview.data.storeReady && item.configured;
            return (
              <article key={item.provider} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10">
                    <Icon className="h-[18px] w-[18px] text-cyan-200" />
                  </span>
                  <div className="min-w-0">
                    <div className={panelEyebrow}>{purpose.title}</div>
                    <div className="text-base font-semibold text-sky-50">{item.label}</div>
                  </div>
                </div>
                <p className="text-xs leading-5 text-sky-300/70">{purpose.detail}</p>
                <div className="text-xs">
                  {connected ? (
                    <span className={toneText.healthy}>
                      Connected as <strong>{connection?.account.login || connection?.account.name || "your account"}</strong> since {new Date(connection!.connectedAt).toLocaleDateString()}
                    </span>
                  ) : connection?.status === "disconnected" ? (
                    <span className={toneText.warning}>Disconnected ({(connection.disconnectedReason ?? "access ended").replace(/_/g, " ")}). Connect again to use it.</span>
                  ) : (
                    <span className="text-sky-300/60">{usable ? "Not connected. No account? You can create one in the next step." : "Not available yet."}</span>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  {connected ? (
                    <>
                      <button type="button" onClick={() => void accounts.disconnect(item.provider, item.label)} disabled={accounts.busy !== null} className={pillButton("warning")}>
                        <Unplug className="h-3 w-3" /> {accounts.busy === item.provider ? "Disconnecting" : "Disconnect"}
                      </button>
                      {item.manageUrl ? (
                        <a href={item.manageUrl} target="_blank" rel="noreferrer" className={quietButton}>
                          <ExternalLink className="h-3 w-3" /> On {item.label}
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <button type="button" onClick={() => void accounts.connect(item.provider)} disabled={!usable || accounts.busy !== null} className={pillButton("active")}>
                      {accounts.busy === item.provider ? "Opening" : `Continue with ${item.label}`}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-2">
        <div className={panelEyebrow}>Recent uses</div>
        {accounts.uses.length === 0 ? (
          <p className="text-xs text-sky-300/60">Nothing yet. Every time KoreLumina uses a connection, it is listed here.</p>
        ) : (
          <ul className="grid gap-1">
            {accounts.uses.slice(0, 15).map((use, index) => (
              <li key={index} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 px-3 py-2 text-xs">
                <span className="text-sky-50">
                  {ACTION[use.action] ?? use.action.replace(/-/g, " ")} · {PURPOSE[use.provider]?.title ?? use.provider}
                  {use.projectId ? <span className="text-sky-300/60"> · {use.projectId}</span> : null}
                  {use.outcome === "disconnected" || use.outcome === "refused" ? <span className={toneText.warning}> · access had ended</span> : null}
                </span>
                <span className="text-sky-300/50">{when(use.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SettingsPanel>
  );
}
