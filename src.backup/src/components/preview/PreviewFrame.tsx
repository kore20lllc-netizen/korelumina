import { RotateCw, ExternalLink, Smartphone, Monitor, Tablet, Lock, Maximize2, Minimize2, Settings, Globe, Lock as LockIcon, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useProjectSettings } from "@/hooks/use-project-settings";
import { ProjectSettingsDialog } from "@/components/preview/ProjectSettingsDialog";
import { PREVIEW_HOST } from "@/lib/projectSettings";
import { getCapabilities } from "@/services/workspaceAccessService";
import { useCurrentRole } from "@/hooks/use-current-role";
import { UpgradeModal, type UpgradeReason } from "@/components/preview/UpgradeModal";
import {
  setPendingUpgradeAction,
  getPendingUpgradeAction,
  clearPendingUpgradeAction,
} from "@/services/pendingUpgradeAction";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check } from "lucide-react";

type Device = "desktop" | "tablet" | "mobile";

export function PreviewFrame({
  url,
  children,
}: {
  url?: string;
  children?: React.ReactNode;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const [reloading, setReloading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason>("fullscreen");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { slug } = useProjectSettings();
  const [role] = useCurrentRole();
  const caps = getCapabilities(role);

  const promptUpgrade = (reason: UpgradeReason) => {
    setPendingUpgradeAction(reason, slug);
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  };

  const resumeAfterUpgrade = (reason: UpgradeReason) => {
    clearPendingUpgradeAction();
    // Defer so capability check (driven by role state) updates first.
    setTimeout(() => {
      if (reason === "browser") {
        window.open(`/preview/${slug}`, "_blank", "noopener,noreferrer");
      } else if (reason === "fullscreen") {
        setFullscreen(true);
      } else if (reason === "slug") {
        setSettingsOpen(true);
      }
    }, 50);
  };

  // After a refresh, if the user has the capability they were trying to use,
  // automatically resume the locked action they clicked before checkout.
  useEffect(() => {
    const pending = getPendingUpgradeAction();
    if (!pending) return;
    const satisfied =
      (pending.reason === "fullscreen" && caps.fullscreenPreview) ||
      (pending.reason === "browser" && caps.browserPreview) ||
      (pending.reason === "slug" && caps.customSlug);
    if (!satisfied) return;
    clearPendingUpgradeAction();
    const targetSlug = pending.slug || slug;
    const t = setTimeout(() => {
      if (pending.reason === "browser") {
        window.open(`/preview/${targetSlug}`, "_blank", "noopener,noreferrer");
      } else if (pending.reason === "fullscreen") {
        setFullscreen(true);
      } else if (pending.reason === "slug") {
        setSettingsOpen(true);
      }
    }, 80);
    return () => clearTimeout(t);
    // Run once per capability snapshot change.
  }, [caps.fullscreenPreview, caps.browserPreview, caps.customSlug, slug]);

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
  const isFreePlan = role === "user";

  const LOCK_TOOLTIPS: Record<"fullscreen" | "browser", { title: string; tier: string; perks: string[] }> = {
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

  const LockedTooltip = ({
    feature,
    children,
  }: {
    feature: "fullscreen" | "browser";
    children: React.ReactNode;
  }) => {
    const info = LOCK_TOOLTIPS[feature];
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs p-0 overflow-hidden border-gold/40">
            <div className="px-3 py-2 bg-gradient-to-b from-gold/15 to-transparent border-b border-gold/20">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-gold">
                <LockIcon className="h-3 w-3" /> Locked
              </div>
              <div className="font-medium text-sm mt-0.5">{info.title}</div>
              <div className="text-[11px] text-muted-foreground">Unlock with {info.tier}</div>
            </div>
            <ul className="px-3 py-2 space-y-1">
              {info.perks.map((p) => (
                <li key={p} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Check className="h-3 w-3 mt-0.5 text-cyan shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-gold border-t border-border bg-surface-1/40">
              Click to upgrade
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const displayUrl = url ?? `${PREVIEW_HOST}/${slug}`;
  const navigableUrl = url
    ? /^https?:\/\//i.test(url)
      ? url
      : `https://${url}`
    : undefined;

  const handleReload = () => {
    setReloading(true);
    if (navigableUrl) {
      // Force iframe reload by remounting
      setIframeKey((k) => k + 1);
    }
    setTimeout(() => setReloading(false), 700);
  };

  const handleOpenExternal = () => {
    if (navigableUrl) window.open(navigableUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenInBrowser = () => {
    if (!caps.browserPreview) {
      promptUpgrade("browser");
      return;
    }
    window.open(`/preview/${slug}`, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

  const widthMap: Record<Device, string> = {
    desktop: "w-full h-full",
    tablet: "w-[768px] max-w-full h-full",
    mobile: "w-[390px] max-w-full h-full",
  };

  return (
    <div
      className={cn(
        "flex flex-col min-h-0",
        fullscreen ? "fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl p-4 md:p-6" : "h-full",
      )}
    >
      {/* URL bar */}
      <div className="flex items-center gap-2 px-3 h-11 rounded-2xl glass mb-3 shrink-0">
        <button
          onClick={handleReload}
          className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition"
          aria-label="Reload"
        >
          <RotateCw
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              reloading && "animate-spin"
            )}
          />
        </button>
        <div className="flex items-center gap-1.5 px-3 h-7 flex-1 rounded-lg bg-background/50 border border-border text-xs text-muted-foreground min-w-0">
          <Lock className="h-3 w-3 text-cyan shrink-0" />
          <span className="truncate">{displayUrl}</span>
        </div>

        <button
          onClick={() => isFreePlan && promptUpgrade("browser")}
          className={cn(
            "hidden sm:inline-flex items-center gap-1 h-7 px-2 rounded-md border text-[10px] uppercase tracking-[0.16em] transition",
            isFreePlan
              ? "border-gold/40 bg-gold/10 text-gold hover:bg-gold/15"
              : "border-border bg-surface-1 text-muted-foreground cursor-default",
          )}
          aria-label={isFreePlan ? `${planLabel} plan — click to upgrade` : `${planLabel} plan`}
          title={isFreePlan ? "Free plan — upgrade for more preview modes" : `${planLabel} plan`}
        >
          {isFreePlan && <Sparkles className="h-3 w-3" />}
          {planLabel}
        </button>

        <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-1 border border-border">
          {(
            [
              { d: "desktop" as const, Icon: Monitor },
              { d: "tablet" as const, Icon: Tablet },
              { d: "mobile" as const, Icon: Smartphone },
            ]
          ).map(({ d, Icon }) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={cn(
                "h-7 w-7 grid place-items-center rounded-md transition",
                device === d
                  ? "bg-surface-3 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={d}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Preview mode segmented control with explicit locked affordances */}
        <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-1 border border-border ml-1">
          <div
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-surface-3 text-foreground text-[11px]"
            title="Embedded preview (included on all plans)"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Embedded</span>
          </div>
          {caps.fullscreenPreview ? (
            <button
            onClick={() => {
              setFullscreen(true);
            }}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] transition text-muted-foreground hover:text-foreground hover:bg-surface-2"
              aria-label="Fullscreen preview"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Fullscreen</span>
            </button>
          ) : (
            <LockedTooltip feature="fullscreen">
              <button
                onClick={() => promptUpgrade("fullscreen")}
                className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] transition text-muted-foreground/70 border border-dashed border-gold/30 hover:bg-gold/5"
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
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] transition text-muted-foreground hover:text-foreground hover:bg-surface-2"
              aria-label="Browser preview"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Browser</span>
            </button>
          ) : (
            <LockedTooltip feature="browser">
              <button
                onClick={() => promptUpgrade("browser")}
                className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] transition text-muted-foreground/70 border border-dashed border-gold/30 hover:bg-gold/5"
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
          className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <button
          onClick={handleOpenInBrowser}
          className={cn(
            "h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition relative",
            !caps.browserPreview && "opacity-60",
          )}
          aria-label={caps.browserPreview ? "Open in browser preview" : "Open in browser (Pro)"}
          title={caps.browserPreview ? "Open in browser" : "Pro feature — upgrade to unlock"}
        >
          <Globe className="h-3.5 w-3.5 text-gold" />
          {!caps.browserPreview && (
            <LockIcon className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-muted-foreground" />
          )}
        </button>

        <button
          onClick={() => {
            if (!caps.fullscreenPreview && !fullscreen) {
              promptUpgrade("fullscreen");
              return;
            }
            setFullscreen((v) => !v);
          }}
          className={cn(
            "h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition relative",
            !caps.fullscreenPreview && !fullscreen && "opacity-60",
          )}
          aria-label={fullscreen ? "Exit fullscreen" : caps.fullscreenPreview ? "Enter fullscreen" : "Fullscreen (Pro)"}
          title={caps.fullscreenPreview || fullscreen ? undefined : "Pro feature — upgrade to unlock"}
        >
          {fullscreen ? (
            <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {!caps.fullscreenPreview && !fullscreen && (
            <LockIcon className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-muted-foreground" />
          )}
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition"
          aria-label="Project settings"
          title="Project settings"
        >
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Preview viewport */}
      <div className="flex-1 min-h-0 relative rounded-3xl overflow-hidden glass-strong p-4 md:p-6 grid place-items-center">
        <div
          className={cn(
            "relative transition-all duration-500 ease-fluid",
            widthMap[device]
          )}
        >
          <div className="absolute -inset-2 rounded-3xl bg-button-lumina opacity-20 blur-2xl pointer-events-none" />
          <div className="relative h-full w-full rounded-2xl overflow-hidden bg-background border border-border shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]">
            {navigableUrl ? (
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={navigableUrl}
                title="Preview"
                className="block w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            ) : (
              children ?? <PreviewSkeleton />
            )}
          </div>
        </div>
      </div>

      <ProjectSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        reason={upgradeReason}
        onUpgraded={() => resumeAfterUpgrade(upgradeReason)}
      />
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="h-full w-full relative">
      <div className="absolute inset-0 bg-aurora opacity-60" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs text-muted-foreground mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_hsl(var(--cyan))]" />
            Live preview
          </div>
          <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Your <span className="text-gradient-lumina">creation</span> appears here
          </h3>
          <p className="text-muted-foreground text-sm mt-3 max-w-sm mx-auto">
            As you build, the preview updates in real time with smooth, fluid transitions.
          </p>
        </div>
      </div>
    </div>
  );
}
