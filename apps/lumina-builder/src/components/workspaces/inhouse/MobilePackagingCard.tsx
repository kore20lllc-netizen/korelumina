import { useEffect, useMemo, useState } from "react";
import {
  Smartphone, Apple, Bot, Hammer, RefreshCw, Rocket, Loader2,
  CheckCircle2, AlertCircle, Copy, Download, Terminal, Plus, Package, Trash2, Pin,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  buildMobileBundle, getCapacitorLogs, getCapacitorStatus,
  initializeCapacitor, installPlugin, uninstallPlugin, openAndroid, openIOS,
  saveCapacitorConfig, syncCapacitor,
  type CapacitorConfig, type CapacitorLogEntry, type CapacitorStatus,
} from "@/services/capacitorService";

type ActionKey = "init" | "sync" | "ios" | "android" | "build" | "save" | string;

const PLUGINS = [
  { id: "camera", label: "Camera", defaultVersion: "^6.0.0" },
  { id: "push-notifications", label: "Push Notifications", defaultVersion: "^6.0.0" },
  { id: "filesystem", label: "Filesystem", defaultVersion: "^6.0.0" },
  { id: "geolocation", label: "Geolocation", defaultVersion: "^6.0.0" },
  { id: "biometrics", label: "Biometrics", defaultVersion: "latest" },
];

const VERSION_RE = /^(latest|\^?\d+(\.\d+){0,2}(-[\w.]+)?|~?\d+(\.\d+){0,2})$/;
const RETRY_COOLDOWN_SECONDS = 5;

const PIN_STORAGE_KEY = "korelumina:capacitor:pinned-versions";

function loadPinned(projectId: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const all = JSON.parse(window.localStorage.getItem(PIN_STORAGE_KEY) || "{}");
    return (all && typeof all === "object" && all[projectId]) || {};
  } catch {
    return {};
  }
}

function savePinned(projectId: string, versions: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(window.localStorage.getItem(PIN_STORAGE_KEY) || "{}");
    const next = { ...(all && typeof all === "object" ? all : {}), [projectId]: versions };
    window.localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
}

const STATUS_TONE: Record<string, string> = {
  ready: "text-cyan border-cyan/30 bg-cyan/10",
  initialized: "text-cyan border-cyan/30 bg-cyan/10",
  generated: "text-cyan border-cyan/30 bg-cyan/10",
  "not-ready": "text-muted-foreground border-white/10 bg-surface-2",
  "not-initialized": "text-muted-foreground border-white/10 bg-surface-2",
  missing: "text-muted-foreground border-white/10 bg-surface-2",
};

const PLATFORM_ICON: Record<string, any> = {
  web: Rocket, capacitor: Package, ios: Apple, android: Bot,
};

export function MobilePackagingCard({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<CapacitorStatus | null>(null);
  const [logs, setLogs] = useState<CapacitorLogEntry[]>([]);
  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [config, setConfig] = useState<CapacitorConfig | null>(null);
  const [pluginVersions, setPluginVersions] = useState<Record<string, string>>(() => {
    const defaults = Object.fromEntries(PLUGINS.map((p) => [p.id, p.defaultVersion]));
    return { ...defaults, ...loadPinned(projectId) };
  });
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; label: string; version: string } | null>(null);
  const [uninstallErrors, setUninstallErrors] = useState<Record<string, string>>({});
  const [retryCooldowns, setRetryCooldowns] = useState<Record<string, number>>({});
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>({});

  // Re-hydrate pinned versions when the project changes.
  useEffect(() => {
    const defaults = Object.fromEntries(PLUGINS.map((p) => [p.id, p.defaultVersion]));
    setPluginVersions({ ...defaults, ...loadPinned(projectId) });
  }, [projectId]);

  // Persist every change to localStorage, scoped per project.
  useEffect(() => {
    savePinned(projectId, pluginVersions);
  }, [projectId, pluginVersions]);

  const refresh = async () => {
    const [s, l] = await Promise.all([getCapacitorStatus(projectId), getCapacitorLogs(projectId)]);
    setStatus(s);
    setConfig(s.config);
    setLogs(l);
    // Sync any server-known installed versions back into the inputs so the UI
    // reflects what's actually pinned in capacitor.config.ts after a refresh.
    if (s.installedPlugins.length) {
      setPluginVersions((prev) => {
        const next = { ...prev };
        for (const ip of s.installedPlugins) next[ip.id] = ip.version;
        return next;
      });
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [projectId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRetryCooldowns((prev) => {
        const next: Record<string, number> = {};
        let hasAny = false;
        for (const [id, secs] of Object.entries(prev)) {
          if (secs > 1) {
            next[id] = secs - 1;
            hasAny = true;
          }
        }
        return hasAny ? next : {};
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const run = async (key: ActionKey, fn: () => Promise<{ ok: boolean; message: string }>, successTitle?: string) => {
    setBusy(key);
    try {
      const r = await fn();
      if (r.ok) toast.success(successTitle ?? r.message);
      else toast.error(r.message);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const doUninstall = async (pluginId: string) => {
    setBusy(`plugin:rm:${pluginId}`);
    setUninstallErrors((prev) => { const n = { ...prev }; delete n[pluginId]; return n; });
    try {
      const r = await uninstallPlugin(projectId, pluginId);
      if (r.ok) {
        toast.success(r.message);
      } else {
        toast.error(r.message);
        setUninstallErrors((prev) => ({ ...prev, [pluginId]: r.message }));
      }
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Uninstall failed";
      toast.error(msg);
      setUninstallErrors((prev) => ({ ...prev, [pluginId]: msg }));
    } finally {
      setBusy(null);
      setRetryCooldowns((prev) => ({ ...prev, [pluginId]: RETRY_COOLDOWN_SECONDS }));
    }
  };

  const initialized = useMemo(
    () => status?.platforms.find((p) => p.platform === "capacitor")?.status === "initialized",
    [status],
  );

  const lastSync = status?.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : "Never";

  const logText = logs.map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.line}`).join("\n");

  return (
    <div className="relative rounded-2xl border border-gold/25 bg-gradient-to-br from-[hsl(220_40%_10%)] via-[hsl(230_40%_8%)] to-[hsl(220_50%_6%)] overflow-hidden">
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-electric/20 blur-3xl" />
      </div>

      <div className="relative p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-gold to-electric grid place-items-center shadow-[0_4px_16px_-4px_hsl(45_90%_55%/0.6)]">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.14em] mb-1">
                Internal · In-House Dev
              </div>
              <div className="font-display text-xl md:text-2xl font-semibold tracking-tight">Mobile App Packaging</div>
              <div className="text-[13px] text-muted-foreground mt-0.5">
                Convert this project into native iOS and Android apps using Capacitor.
              </div>
            </div>
          </div>
          <LuminaButton variant="ghost" size="sm" onClick={() => refresh()} title="Refresh status">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </LuminaButton>
        </div>

        {/* Success banner */}
        {initialized && (
          <div className="rounded-xl border border-cyan/25 bg-cyan/[0.06] px-4 py-3 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-cyan shrink-0 mt-0.5" />
            <div>
              <div className="text-[13px] font-medium">Mobile Projects Ready</div>
              <div className="text-[12px] text-muted-foreground">
                This project can now be opened in Xcode and Android Studio.
              </div>
            </div>
          </div>
        )}

        {/* Primary actions */}
        <div className="flex flex-wrap gap-2">
          <LuminaButton onClick={() => run("init", () => initializeCapacitor(projectId), "Capacitor initialized")} disabled={!!busy}>
            {busy === "init" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
            Initialize Capacitor
          </LuminaButton>
          <LuminaButton variant="glow" onClick={() => run("sync", () => syncCapacitor(projectId))} disabled={!!busy}>
            {busy === "sync" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync Native Projects
          </LuminaButton>
          <LuminaButton variant="glow" onClick={() => run("ios", () => openIOS(projectId))} disabled={!!busy}>
            {busy === "ios" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Apple className="h-3.5 w-3.5" />}
            Open iOS
          </LuminaButton>
          <LuminaButton variant="glow" onClick={() => run("android", () => openAndroid(projectId))} disabled={!!busy}>
            {busy === "android" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
            Open Android
          </LuminaButton>
          <LuminaButton variant="outline" onClick={() => run("build", () => buildMobileBundle(projectId))} disabled={!!busy}>
            {busy === "build" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Hammer className="h-3.5 w-3.5" />}
            Build Mobile Bundle
          </LuminaButton>
        </div>

        {/* Platform status */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {status?.platforms.map((p) => {
            const Icon = PLATFORM_ICON[p.platform] ?? Rocket;
            return (
              <div key={p.platform} className="rounded-xl border border-white/10 bg-surface-1/60 backdrop-blur p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-foreground/80" />
                  <div className="text-[13px] font-medium capitalize">{p.platform}</div>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-[0.12em]",
                    STATUS_TONE[p.status] ?? STATUS_TONE.missing,
                  )}
                >
                  {p.status.replace("-", " ")}
                </div>
                {p.detail && <div className="text-[11px] text-muted-foreground mt-2">{p.detail}</div>}
              </div>
            );
          })}
        </div>

        {/* App metadata */}
        <div className="rounded-xl border border-white/10 bg-surface-1/40 p-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">App Metadata</div>
          {config && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {([
                ["appName", "App Name"],
                ["appId", "App ID / Bundle"],
                ["version", "Version"],
                ["buildNumber", "Build Number"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <input
                    value={config[key]}
                    onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                    className="h-9 px-3 rounded-lg bg-surface-2 border border-white/10 text-[13px] outline-none focus:border-gold/40 transition"
                  />
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <LuminaButton
              size="sm"
              onClick={() => config && run("save", () => saveCapacitorConfig(projectId, config), "Configuration saved")}
              disabled={!!busy || !config}
            >
              {busy === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Save Config
            </LuminaButton>
          </div>
        </div>

        {/* Plugins */}
        <div className="rounded-xl border border-white/10 bg-surface-1/40 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Plugin Management</div>
            <div className="text-[11px] text-muted-foreground">{status?.installedPlugins.length ?? 0} installed</div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {PLUGINS.map((p) => {
              const installed = status?.installedPlugins.find((ip) => ip.id === p.id);
              const draftVersion = pluginVersions[p.id] ?? p.defaultVersion;
              const validVersion = VERSION_RE.test(draftVersion.trim());
              const pendingChange = installed && installed.version !== draftVersion;
              const removing = busy === `plugin:rm:${p.id}`;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-lg border border-white/10 bg-surface-2/60 px-3 py-2.5 space-y-2 transition-opacity",
                    removing && "opacity-60 pointer-events-none",
                  )}
                  aria-busy={removing || undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">{p.label}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        @capacitor/{p.id}
                        {installed && !removing && <span className="text-cyan"> · installed {installed.version}</span>}
                        {removing && <span className="text-rose-300"> · uninstalling…</span>}
                      </div>
                    </div>
                    {installed && (
                      <LuminaButton
                        size={removing ? "sm" : "icon"}
                        variant="ghost"
                        disabled={!!busy}
                        title={removing ? "Uninstalling…" : "Uninstall"}
                        onClick={() => setConfirmRemove({ id: p.id, label: p.label, version: installed.version })}
                      >
                        {removing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Uninstalling…
                          </>
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </LuminaButton>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Pin className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <input
                        value={draftVersion}
                        onChange={(e) => setPluginVersions((v) => ({ ...v, [p.id]: e.target.value }))}
                        placeholder="latest or ^6.0.0"
                        aria-invalid={!validVersion}
                        className={cn(
                          "w-full h-8 pl-7 pr-2 rounded-md bg-surface-1 border text-[12px] font-mono outline-none transition",
                          validVersion ? "border-white/10 focus:border-gold/40" : "border-rose-400/50 focus:border-rose-400",
                        )}
                      />
                    </div>
                    <LuminaButton
                      size="sm"
                      variant={installed && !pendingChange ? "ghost" : "outline"}
                      disabled={!!busy || !validVersion || (!!installed && !pendingChange)}
                      onClick={() => run(`plugin:${p.id}`, () => installPlugin(projectId, p.id, draftVersion.trim()))}
                      title={!validVersion ? "Invalid semver" : pendingChange ? "Re-pin to this version" : installed ? "Already installed at this version" : "Install"}
                    >
                      {busy === `plugin:${p.id}`
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : installed && !pendingChange
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-cyan" />
                          : pendingChange
                            ? <Pin className="h-3.5 w-3.5" />
                            : <Plus className="h-3.5 w-3.5" />}
                      {installed && !pendingChange ? "Installed" : pendingChange ? "Re-pin" : "Install"}
                    </LuminaButton>
                  </div>
                  {!validVersion && (
                    <div className="text-[10px] text-rose-300">Use a semver like 6.1.2, ^6.0.0, ~6.0.0, or "latest".</div>
                  )}
                  {uninstallErrors[p.id] && (
                    <div className="rounded-md border border-rose-400/30 bg-rose-400/10 overflow-hidden">
                      <button
                        type="button"
                        className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left"
                        onClick={() => setExpandedErrors((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-300 shrink-0" />
                          <span className="text-[11px] text-rose-200 truncate">{uninstallErrors[p.id]}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <LuminaButton
                            size="sm"
                            variant="ghost"
                            disabled={!!busy || !!retryCooldowns[p.id]}
                            onClick={(e) => { e.stopPropagation(); doUninstall(p.id); }}
                          >
                            {retryCooldowns[p.id] ? `Retry (${retryCooldowns[p.id]}s)` : "Retry"}
                          </LuminaButton>
                          {expandedErrors[p.id] ? (
                            <ChevronUp className="h-3.5 w-3.5 text-rose-300" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-rose-300" />
                          )}
                        </div>
                      </button>
                      {expandedErrors[p.id] && (
                        <div className="px-3 pb-2">
                          <div className="flex items-center justify-end gap-1.5 mb-1">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-[10px] text-rose-200/70 hover:text-rose-200 transition"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(uninstallErrors[p.id]!);
                                  toast.success("Error copied to clipboard");
                                } catch {
                                  toast.error("Copy failed");
                                }
                              }}
                            >
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                          </div>
                          <pre className="text-[11px] text-rose-200/80 font-mono whitespace-pre-wrap break-words bg-black/20 rounded-md p-2.5">
                            {uninstallErrors[p.id]}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Output */}
        <div className="grid lg:grid-cols-3 gap-3">
          <OutputRow label="Capacitor config" value={status?.configPath ?? "—"} />
          <OutputRow label="iOS project" value={status?.iosPath ?? "—"} />
          <OutputRow label="Android project" value={status?.androidPath ?? "—"} />
          <OutputRow label="Last sync" value={lastSync} />
          <OutputRow label="Recent logs" value={`${logs.length} entries`} />
          <div className="flex items-end">
            <LuminaButton variant="outline" size="sm" onClick={() => setDrawerOpen(true)} className="w-full">
              <Terminal className="h-3.5 w-3.5" /> Open Build Logs
            </LuminaButton>
          </div>
        </div>
      </div>

      {/* Build logs drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-background/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-2xl glass-strong border-l border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-gold" />
                <div className="font-display font-semibold text-[14px]">Build Logs</div>
              </div>
              <div className="flex items-center gap-2">
                <LuminaButton size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(logText); toast.success("Logs copied"); }}>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </LuminaButton>
                <LuminaButton size="sm" variant="ghost" onClick={() => {
                  const blob = new Blob([logText], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `${projectId}-capacitor-logs.txt`; a.click();
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="h-3.5 w-3.5" /> Download
                </LuminaButton>
                <LuminaButton size="sm" variant="outline" onClick={() => setDrawerOpen(false)}>Close</LuminaButton>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-5 font-mono text-[12px] leading-relaxed text-foreground/85 bg-black/40">
              {logs.length === 0 ? (
                <span className="text-muted-foreground">No log entries yet. Run an action to populate this drawer.</span>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className={cn(l.stream === "stderr" && "text-rose-300", l.stream === "info" && "text-gold")}>
                    <span className="text-muted-foreground">[{new Date(l.timestamp).toLocaleTimeString()}]</span>{" "}
                    <span className="text-muted-foreground/70">{l.command}</span>{" "}
                    {l.line}
                  </div>
                ))
              )}
            </pre>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent className="glass-strong border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Uninstall {confirmRemove?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-mono text-foreground">@capacitor/{confirmRemove?.id}@{confirmRemove?.version}</span>{" "}
              from this project and run <span className="font-mono text-foreground">npm rm</span>. You can reinstall it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmRemove) return;
                const id = confirmRemove.id;
                setConfirmRemove(null);
                doUninstall(id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Uninstall
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OutputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-surface-2/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="text-[12px] font-mono mt-1 truncate" title={value}>{value}</div>
    </div>
  );
}