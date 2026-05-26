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
  AlertTriangle,
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
  children?: React.ReactNode;
};

const DEVICE_WIDTHS: Record<
  Device,
  string
> = {
  desktop: "w-full h-full",
  tablet: "w-[768px] max-w-full h-full",
  mobile: "w-[390px] max-w-full h-full",
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
  input?: string,
): string | undefined {
  if (!input?.trim()) {
    return undefined;
  }

  const trimmed = input.trim();

  if (
    /^https?:\/\//i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }

  if (
    trimmed.startsWith(
      "localhost:",
    ) ||
    trimmed.startsWith(
      "127.0.0.1:",
    )
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
            {info.perks.map(
              (perk) => (
                <li
                  key={perk}
                  className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
                >
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-cyan" />

                  <span>
                    {perk}
                  </span>
                </li>
              ),
            )}
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
  children,
}: PreviewFrameProps) {
  const iframeRef =
    useRef<HTMLIFrameElement | null>(
      null,
    );

  const [device, setDevice] =
    useState<Device>(
      "desktop",
    );

  const [
    reloading,
    setReloading,
  ] = useState(false);


  const [
    iframeLoaded,
    setIframeLoaded,
  ] = useState(false);

  const [
    iframeError,
    setIframeError,
  ] = useState<string | null>(
    null,
  );

  const [
    fullscreen,
    setFullscreen,
  ] = useState(false);

  const [
    settingsOpen,
    setSettingsOpen,
  ] = useState(false);

  const [
    upgradeOpen,
    setUpgradeOpen,
  ] = useState(false);

  const [
    upgradeReason,
    setUpgradeReason,
  ] =
    useState<UpgradeReason>(
      "fullscreen",
    );

  const { slug } =
    useProjectSettings();

  const [role] =
    useCurrentRole();

  const caps =
    getCapabilities(role);

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

  const navigableUrl =
    useMemo(
      () =>
        normalizePreviewUrl(
          url,
        ),
      [url],
    );

  useEffect(() => {
    console.log(
      "[PreviewFrame]",
      {
        incomingUrl: url,
        navigableUrl,
      },
    );
  }, [url, navigableUrl]);

  const displayUrl =
    navigableUrl ??
    `${PREVIEW_HOST}/${slug}`;

  useEffect(() => {
  setIframeLoaded(false);
  setIframeError(null);
}, [navigableUrl]);

  useEffect(() => {
    if (!navigableUrl) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          if (
            !iframeLoaded
          ) {
            setIframeError(
              "Preview runtime unreachable",
            );
          }
        },
        12000,
      );

    return () =>
      window.clearTimeout(
        timeout,
      );
  }, [
  navigableUrl,
  iframeLoaded,
]);

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

    setUpgradeOpen(true);
  };

  const resumeAfterUpgrade =
    (
      reason: UpgradeReason,
    ) => {
      clearPendingUpgradeAction();

      setTimeout(() => {
        if (
          reason ===
          "browser"
        ) {
          if (navigableUrl) {
            window.open(
              navigableUrl,
              "_blank",
              "noopener,noreferrer",
            );
          }
        }

        if (
          reason ===
          "fullscreen"
        ) {
          setFullscreen(
            true,
          );
        }

        if (
          reason ===
          "slug"
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
      (pending.reason ===
        "fullscreen" &&
        caps.fullscreenPreview) ||
      (pending.reason ===
        "browser" &&
        caps.browserPreview) ||
      (pending.reason ===
        "slug" &&
        caps.customSlug);

    if (!satisfied) {
      return;
    }

    clearPendingUpgradeAction();

    const targetSlug =
      pending.slug ||
      slug;

    const timeout =
      setTimeout(() => {
        if (
          pending.reason ===
          "browser"
        ) {
          window.open(
            `/preview/${targetSlug}`,
            "_blank",
            "noopener,noreferrer",
          );
        }

        if (
          pending.reason ===
          "fullscreen"
        ) {
          setFullscreen(
            true,
          );
        }

        if (
          pending.reason ===
          "slug"
        ) {
          setSettingsOpen(
            true,
          );
        }
      }, 80);

    return () =>
      clearTimeout(
        timeout,
      );
  }, [
    caps.fullscreenPreview,
    caps.browserPreview,
    caps.customSlug,
    slug,
  ]);

  useEffect(() => {
    if (!fullscreen) {
      return;
    }

    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setFullscreen(
          false,
        );
      }
    };

    window.addEventListener(
      "keydown",
      onKeyDown,
    );

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [fullscreen]);

  const handleReload =
    () => {
      setReloading(true);

      setIframeLoaded(false);
      setIframeError(null);

      try {
  iframeRef.current?.contentWindow?.location.reload();
} catch {
  if (
    iframeRef.current &&
    navigableUrl
  ) {
    iframeRef.current.src =
      navigableUrl;
  }
}

      setTimeout(() => {
        setReloading(false);
      }, 700);
    };

  const handleOpenExternal =
    () => {
      if (
        !navigableUrl
      ) {
        return;
      }

      window.open(
        navigableUrl,
        "_blank",
        "noopener,noreferrer",
      );
    };

  const handleOpenInBrowser =
    () => {
      if (
        !caps.browserPreview
      ) {
        promptUpgrade(
          "browser",
        );

        return;
      }

      if (
        navigableUrl
      ) {
        window.open(
          navigableUrl,
          "_blank",
          "noopener,noreferrer",
        );
      }
    };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        fullscreen
          ? "fixed inset-0 z-[100] bg-background/95 p-4 backdrop-blur-xl md:p-6"
          : "h-full w-full",
      )}
    >
      <div className="mb-3 flex h-11 shrink-0 items-center gap-2 overflow-hidden rounded-2xl glass px-3">
        <button
          onClick={
            handleReload
          }
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition hover:bg-surface-2"
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

        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border bg-background/50 px-3 text-xs text-muted-foreground h-7">
          <Lock className="h-3 w-3 shrink-0 text-cyan" />

          <span className="truncate">
            {displayUrl}
          </span>
        </div>

        <div className="hidden shrink-0 items-center gap-0.5 rounded-lg border border-border bg-surface-1 p-0.5 xl:flex">
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
          ].map(
            ({
              d,
              Icon,
            }) => (
              <button
                key={d}
                onClick={() =>
                  setDevice(
                    d,
                  )
                }
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-md transition",
                  device === d
                    ? "bg-surface-3 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ),
          )}
        </div>

        <button
          onClick={() =>
            isFreePlan &&
            promptUpgrade(
              "browser",
            )
          }
          className={cn(
            "hidden h-7 shrink-0 items-center gap-1 rounded-md border px-2 text-[10px] uppercase tracking-[0.16em] transition lg:inline-flex",
            isFreePlan
              ? "border-gold/40 bg-gold/10 text-gold hover:bg-gold/15"
              : "cursor-default border-border bg-surface-1 text-muted-foreground",
          )}
        >
          {isFreePlan && (
            <Sparkles className="h-3 w-3" />
          )}

          {planLabel}
        </button>

        <button
          onClick={
            handleOpenExternal
          }
          disabled={
            !navigableUrl
          }
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <button
          onClick={
            handleOpenInBrowser
          }
          className={cn(
            "relative grid h-8 w-8 shrink-0 place-items-center rounded-lg transition hover:bg-surface-2",
            !caps.browserPreview &&
              "opacity-60",
          )}
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
              (
                current,
              ) =>
                !current,
            );
          }}
          className={cn(
            "relative grid h-8 w-8 shrink-0 place-items-center rounded-lg transition hover:bg-surface-2",
            !caps.fullscreenPreview &&
              !fullscreen &&
              "opacity-60",
          )}
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
            setSettingsOpen(
              true,
            )
          }
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition hover:bg-surface-2"
        >
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden rounded-3xl glass-strong p-4 md:p-6">
        <div className="grid h-full w-full place-items-center overflow-auto">
          <div
            className={cn(
              "relative h-full transition-all duration-500 ease-fluid",
              DEVICE_WIDTHS[
                device
              ],
            )}
          >
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-button-lumina opacity-20 blur-2xl" />

            <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-background">
              {navigableUrl ? (
                <div className="relative h-full w-full">
                  <iframe
                    ref={iframeRef}
                    src={navigableUrl}
                    title="Preview"
                    className="block h-full w-full border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    allow="clipboard-read; clipboard-write"
                    onLoad={() => {
                      console.log(
                        "[PreviewFrame] iframe loaded:",
                        navigableUrl,
                      );

                      setIframeLoaded(
                        true,
                      );

                      setIframeError(
                        null,
                      );
                    }}
                    onError={() => {
                      setIframeError(
                        "Preview failed to load",
                      );
                    }}
                  />

                  {!iframeLoaded && (
                    <div className="absolute inset-0 z-10 grid place-items-center bg-background/80 backdrop-blur-sm">
                      <div className="text-sm text-muted-foreground">
                        Loading preview...
                      </div>
                    </div>
                  )}

                  {iframeError && (
                    <div className="absolute inset-0 z-20">
                      <PreviewError
                        message={
                          iframeError
                        }
                        url={
                          navigableUrl
                        }
                        onReload={
                          handleReload
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                children ?? (
                  <PreviewSkeleton />
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <ProjectSettingsDialog
        open={
          settingsOpen
        }
        onOpenChange={
          setSettingsOpen
        }
      />

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={
          setUpgradeOpen
        }
        reason={
          upgradeReason
        }
        onUpgraded={() =>
          resumeAfterUpgrade(
            upgradeReason,
          )
        }
      />
    </div>
  );
}

function PreviewLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-cyan/20 border-t-cyan animate-spin" />

        <div className="text-sm text-muted-foreground">
          Connecting runtime...
        </div>
      </div>
    </div>
  );
}

function PreviewError({
  message,
  url,
  onReload,
}: {
  message: string;
  url?: string;
  onReload: () => void;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>

        <h3 className="text-lg font-semibold">
          Preview unavailable
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          {message}
        </p>

        {url && (
          <div className="mt-3 rounded-lg border border-border bg-surface-1 px-3 py-2 text-xs text-muted-foreground break-all">
            {url}
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={
              onReload
            }
            className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-2 text-sm transition hover:bg-surface-3"
          >
            <RotateCw className="h-4 w-4" />
            Reload
          </button>

          {url && (
            <button
              onClick={() =>
                window.open(
                  url,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </button>
          )}
        </div>
      </div>
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
            <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_hsl(var(--cyan))] animate-pulse" />

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
            As you build,
            the preview
            updates in
            real time with
            smooth,
            fluid
            transitions.
          </p>
        </div>
      </div>
    </div>
  );
}
