import {
  RotateCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  Lock,
  Maximize2,
  Minimize2,
  Settings,
  Globe,
  Lock as LockIcon,
  Sparkles,
  Check,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import { useProjectSettings } from "@/hooks/use-project-settings";
import { ProjectSettingsDialog } from "@/components/preview/ProjectSettingsDialog";
import { PREVIEW_HOST } from "@/lib/projectSettings";
import { getCapabilities } from "@/services/workspaceAccessService";
import { useCurrentRole } from "@/hooks/use-current-role";

import {
  UpgradeModal,
  type UpgradeReason,
} from "@/components/preview/UpgradeModal";

import {
  setPendingUpgradeAction,
  getPendingUpgradeAction,
  clearPendingUpgradeAction,
} from "@/services/pendingUpgradeAction";

import {
  connectRuntimeEvents,
  getRuntimeStatus,
} from "@/services/runtimeService";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Device =
  | "desktop"
  | "tablet"
  | "mobile";

type PreviewFrameProps = {
  url?: string;
  projectId?: string | null;
  children?: React.ReactNode;
};

const widthMap: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

const LOCK_TOOLTIPS: Record<
  "fullscreen" | "browser",
  {
    title: string;
    tier: string;
    perks: string[];
  }
> = {
  fullscreen: {
    title: "Fullscreen Preview",
    tier: "Pro · $99/month",
    perks: [
      "Distraction-free fullscreen workspace",
      "Activity drawer with peek + reveal",
      "Custom project URL slug",
      "Priority generation queue",
    ],
  },
  browser: {
    title: "Browser Preview",
    tier: "Pro · $99/month",
    perks: [
      "Dedicated full-page browser shell",
      "Desktop / Laptop / Tablet / Mobile sizing",
      "Shareable preview.korelumina.app URL",
      "Business tier adds branded URLs & advanced sharing",
    ],
  },
};

function normalizePreviewUrl(
  input?: string | null,
): string | undefined {
  if (!input?.trim()) {
    return undefined;
  }

  const trimmed =
    input.trim();

  if (
    /^https?:\/\//i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }

  if (
    trimmed.startsWith("localhost:") ||
    trimmed.startsWith("127.0.0.1:")
  ) {
    return `http://${trimmed}`;
  }

  return `https://${trimmed}`;
}

function LockedTooltip({
  feature,
  children,
}: {
  feature:
    | "fullscreen"
    | "browser";
  children: React.ReactNode;
}) {
  const info =
    LOCK_TOOLTIPS[feature];

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>

        <TooltipContent
          side="bottom"
          className="max-w-xs overflow-hidden border-gold/40 p-0"
        >
          <div className="border-b border-gold/20 bg-gradient-to-b from-gold/15 to-transparent px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-gold">
              <LockIcon className="h-3 w-3" />
              Locked
            </div>

            <div className="mt-0.5 text-sm font-medium">
              {info.title}
            </div>

            <div className="text-[11px] text-muted-foreground">
              Unlock with{" "}
              {info.tier}
            </div>
          </div>

          <ul className="space-y-1 px-3 py-2">
            {info.perks.map((perk) => (
              <li
                key={perk}
                className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
              >
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-cyan" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-border bg-surface-1/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-gold">
            Click to upgrade
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PreviewFrame({
  url,
  projectId,
  children,
}: PreviewFrameProps) {
  const [device, setDevice] =
    useState<Device>("desktop");

  const [reloading, setReloading] =
    useState(false);

const [iframeLoaded, setIframeLoaded] =
  useState(false);

const [iframeError, setIframeError] =
  useState<string | null>(null);

  const [iframeKey, setIframeKey] =
    useState(0);

  const [fullscreen, setFullscreen] =
    useState(false);

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [upgradeOpen, setUpgradeOpen] =
    useState(false);

  const [
    upgradeReason,
    setUpgradeReason,
  ] = useState<UpgradeReason>(
    "fullscreen",
  );

  const [
    runtimeUrl,
    setRuntimeUrl,
  ] = useState<string | undefined>(
    normalizePreviewUrl(url),
  );

  const iframeRef =
    useRef<HTMLIFrameElement | null>(null);

  const { slug } =
    useProjectSettings();

  const [role] =
    useCurrentRole();

  const caps =
    getCapabilities(role);

  const promptUpgrade = (
    reason: UpgradeReason,
  ) => {
    setPendingUpgradeAction(
      reason,
      slug,
    );

    setUpgradeReason(
      reason,
    );

    setUpgradeOpen(
      true,
    );
  };

  const resumeAfterUpgrade = (
    reason: UpgradeReason,
  ) => {
    clearPendingUpgradeAction();

    setTimeout(() => {
      if (reason === "browser") {
        window.open(
          `/preview/${slug}`,
          "_blank",
          "noopener,noreferrer",
        );
      } else if (
        reason === "fullscreen"
      ) {
        setFullscreen(
          true,
        );
      } else if (
        reason === "slug"
      ) {
        setSettingsOpen(
          true,
        );
      }
    }, 50);
  };

  useEffect(() => {
    const pending =
      getPendingUpgradeAction();

    if (!pending) {
      return;
    }

    const satisfied =
      (pending.reason === "fullscreen" &&
        caps.fullscreenPreview) ||
      (pending.reason === "browser" &&
        caps.browserPreview) ||
      (pending.reason === "slug" &&
        caps.customSlug);

    if (!satisfied) {
      return;
    }

    clearPendingUpgradeAction();

    const targetSlug =
      pending.slug || slug;

    const timeout =
      setTimeout(() => {
        if (
          pending.reason === "browser"
        ) {
          window.open(
            `/preview/${targetSlug}`,
            "_blank",
            "noopener,noreferrer",
          );
        } else if (
          pending.reason === "fullscreen"
        ) {
          setFullscreen(
            true,
          );
        } else if (
          pending.reason === "slug"
        ) {
          setSettingsOpen(
            true,
          );
        }
      }, 80);

    return () =>
      clearTimeout(timeout);
  }, [
    caps.fullscreenPreview,
    caps.browserPreview,
    caps.customSlug,
    slug,
  ]);

  const planLabel =
    role === "user"
      ? "Free"
      : role === "pro"
        ? "Pro"
        : role === "business"
          ? "Business"
          : role === "enterprise"
            ? "Enterprise"
            : "Dev";

  const isFreePlan =
    role === "user";

  useEffect(() => {
    const nextUrl =
      normalizePreviewUrl(url);

    if (nextUrl) {
      setRuntimeUrl(
        nextUrl,
      );
    }
  }, [url]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let mounted = true;

    async function resolveRuntime() {
      try {
        const runtime =
          await getRuntimeStatus(
            projectId,
          );

        if (!mounted) {
          return;
        }

        if (runtime?.url) {
          setRuntimeUrl(
            normalizePreviewUrl(
              runtime.url,
            ),
          );
        }
      } catch (error) {
        console.error(
          "[PreviewFrame] runtime status failed",
          error,
        );
      }
    }

    void resolveRuntime();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const disconnect =
      connectRuntimeEvents(
        (event) => {
          if (
            event.projectId !==
            projectId
          ) {
            return;
          }

          if (
            event.type ===
            "runtime:file-changed"
          ) {
            handleReload();
          }

          if (
            event.type ===
            "runtime:state"
          ) {
            void getRuntimeStatus(
              projectId,
            ).then((runtime) => {
              if (runtime?.url) {
                setRuntimeUrl(
                  normalizePreviewUrl(
                    runtime.url,
                  ),
                );
              }
            });
          }
        },
      );

    return () => {
      disconnect();
    };
  }, [projectId]);

  useEffect(() => {
    if (!fullscreen) {
      return;
    }

    const onKey = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setFullscreen(
          false,
        );
      }
    };

    window.addEventListener(
      "keydown",
      onKey,
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      window.removeEventListener(
        "keydown",
        onKey,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [fullscreen]);

  const displayUrl =
    runtimeUrl ??
    `${PREVIEW_HOST}/${slug}`;

  const navigableUrl =
    runtimeUrl ??
    undefined;

  const handleReload = () => {
  setReloading(true);

  setIframeLoaded(false);

  setIframeError(null);

  if (navigableUrl) {
    setIframeKey((k) => k + 1);
  }

  window.setTimeout(() => {
    setReloading(false);
  }, 700);
};

  const handleOpenExternal = () => {
    if (!navigableUrl) {
      return;
    }

    window.open(
      navigableUrl,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleOpenInBrowser = () => {
    if (!caps.browserPreview) {
      promptUpgrade(
        "browser",
      );

      return;
    }

    window.open(
      `/preview/${slug}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        fullscreen
          ? "fixed inset-0 z-[100] bg-background/95 p-4 backdrop-blur-xl md:p-6"
          : "h-full",
      )}
    >
      {/* URL bar */}
      <div className="flex h-11 shrink-0 items-center gap-2 rounded-2xl glass mb-3 px-3">
        <button
          onClick={handleReload}
          className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-surface-2"
          aria-label="Reload"
        >
          <RotateCw
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              reloading &&
                "animate-spin",
            )}
          />
        </button>

        <div className="flex h-7 min-w-[140px] flex-1 items-center gap-1.5 overflow-hidden rounded-lg border border-border bg-background/50 px-3 text-xs text-muted-foreground">
          <Lock className="h-3 w-3 shrink-0 text-cyan" />

          <span className="block min-w-0 truncate">
            {displayUrl}
          </span>
        </div>

        <button
          onClick={() =>
            isFreePlan &&
            promptUpgrade(
              "browser",
            )
          }
          className={cn(
            "hidden h-7 items-center gap-1 rounded-md border px-2 text-[10px] uppercase tracking-[0.16em] transition sm:inline-flex",
            isFreePlan
              ? "border-gold/40 bg-gold/10 text-gold hover:bg-gold/15"
              : "cursor-default border-border bg-surface-1 text-muted-foreground",
          )}
          aria-label={
            isFreePlan
              ? `${planLabel} plan — click to upgrade`
              : `${planLabel} plan`
          }
          title={
            isFreePlan
              ? "Free plan — upgrade for more preview modes"
              : `${planLabel} plan`
          }
        >
          {isFreePlan && (
            <Sparkles className="h-3 w-3" />
          )}

          {planLabel}
        </button>

        <div className="hidden items-center gap-0.5 rounded-lg border border-border bg-surface-1 p-0.5 md:flex">
          {[
            {
              d: "desktop" as const,
              Icon: Monitor,
            },
            {
              d: "tablet" as const,
              Icon: Tablet,
            },
            {
              d: "mobile" as const,
              Icon: Smartphone,
            },
          ].map(({ d, Icon }) => (
            <button
              key={d}
              onClick={() =>
                setDevice(d)
              }
              className={cn(
                "grid h-7 w-7 place-items-center rounded-md transition",
                device === d
                  ? "bg-surface-3 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={d}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="ml-1 hidden items-center gap-0.5 rounded-lg border border-border bg-surface-1 p-0.5 md:flex">
          <div
            className="inline-flex h-7 items-center gap-1 rounded-md bg-surface-3 px-2 text-[11px] text-foreground"
            title="Embedded preview (included on all plans)"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Embedded</span>
          </div>

          {caps.fullscreenPreview ? (
            <button
              onClick={() =>
                setFullscreen(true)
              }
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
              aria-label="Fullscreen preview"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Fullscreen</span>
            </button>
          ) : (
            <LockedTooltip feature="fullscreen">
              <button
                onClick={() =>
                  promptUpgrade(
                    "fullscreen",
                  )
                }
                className="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-gold/30 px-2 text-[11px] text-muted-foreground/70 transition hover:bg-gold/5"
                aria-label="Fullscreen preview — locked, upgrade to Pro"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Fullscreen</span>
                <LockIcon className="h-3 w-3 text-gold" />
              </button>
            </LockedTooltip>
          )}

          {caps.browserPreview ? (
            <button
              onClick={handleOpenInBrowser}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
              aria-label="Browser preview"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Browser</span>
            </button>
          ) : (
            <LockedTooltip feature="browser">
              <button
                onClick={() =>
                  promptUpgrade(
                    "browser",
                  )
                }
                className="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-gold/30 px-2 text-[11px] text-muted-foreground/70 transition hover:bg-gold/5"
                aria-label="Browser preview — locked, upgrade to Pro"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Browser</span>
                <LockIcon className="h-3 w-3 text-gold" />
              </button>
            </LockedTooltip>
          )}
        </div>

        <button
          onClick={handleOpenExternal}
          disabled={!navigableUrl}
          className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <button
          onClick={handleOpenInBrowser}
          className={cn(
            "relative grid h-8 w-8 place-items-center rounded-lg transition hover:bg-surface-2",
            !caps.browserPreview &&
              "opacity-60",
          )}
          aria-label={
            caps.browserPreview
              ? "Open in browser preview"
              : "Open in browser (Pro)"
          }
          title={
            caps.browserPreview
              ? "Open in browser"
              : "Pro feature — upgrade to unlock"
          }
        >
          <Globe className="h-3.5 w-3.5 text-gold" />

          {!caps.browserPreview && (
            <LockIcon className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-muted-foreground" />
          )}
        </button>

        <button
          onClick={() => {
            if (
              !caps.fullscreenPreview &&
              !fullscreen
            ) {
              promptUpgrade(
                "fullscreen",
              );

              return;
            }

            setFullscreen(
              (value) => !value,
            );
          }}
          className={cn(
            "relative grid h-8 w-8 place-items-center rounded-lg transition hover:bg-surface-2",
            !caps.fullscreenPreview &&
              !fullscreen &&
              "opacity-60",
          )}
          aria-label={
            fullscreen
              ? "Exit fullscreen"
              : caps.fullscreenPreview
                ? "Enter fullscreen"
                : "Fullscreen (Pro)"
          }
          title={
            caps.fullscreenPreview ||
            fullscreen
              ? undefined
              : "Pro feature — upgrade to unlock"
          }
        >
          {fullscreen ? (
            <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
          )}

          {!caps.fullscreenPreview &&
            !fullscreen && (
              <LockIcon className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-muted-foreground" />
            )}
        </button>

        <button
          onClick={() =>
            setSettingsOpen(true)
          }
          className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-surface-2"
          aria-label="Project settings"
          title="Project settings"
        >
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      {/* Preview viewport */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl glass-strong p-4 md:p-6">
        {(reloading || !iframeLoaded) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050816]/40 text-sm text-white/80 backdrop-blur-sm">
            Rendering preview...
          </div>
        )}

        <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden">
          <div
            className="relative flex h-full min-h-0 max-w-full items-center justify-center transition-all duration-500 ease-fluid"
            style={{
              width: widthMap[device],
            }}
          >
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-button-lumina opacity-20 blur-2xl" />

            <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-background shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]">
              {navigableUrl ? (
                <iframe
                  ref={iframeRef}
                  key={iframeKey}
                  src={navigableUrl}
                  title="Preview"
                  className="block h-full w-full border-0 bg-background"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onLoad={() => {
                    setIframeLoaded(true);
                    setReloading(false);
                    setIframeError(null);
                  }}
                  onError={() => {
                    setIframeError("Preview failed to load");
                    setReloading(false);
                  }}
                />
              ) : (
                children ?? <PreviewSkeleton />
              )}

              {iframeError && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 px-6 text-center text-sm text-red-300">
                  {iframeError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProjectSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        reason={upgradeReason}
        onUpgraded={() =>
          resumeAfterUpgrade(
            upgradeReason,
          )
        }
      />
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-aurora opacity-60" />

      <div className="absolute inset-0 grid place-items-center">
        <div className="px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan shadow-[0_0_8px_hsl(var(--cyan))]" />
            Live preview
          </div>

          <h3 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Your{" "}
            <span className="text-gradient-lumina">
              creation
            </span>{" "}
            appears here
          </h3>

          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            As you build, the preview updates in real time with smooth, fluid transitions.
          </p>
        </div>
      </div>
    </div>
  );
}
