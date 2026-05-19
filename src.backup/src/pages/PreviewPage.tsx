import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Check, ExternalLink, Lock, Monitor, Laptop, Tablet, Smartphone, Settings, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PREVIEW_HOST, getProjectName, getProjectSlug, subscribeProjectSettings } from "@/lib/projectSettings";
import { ProjectSettingsDialog } from "@/components/preview/ProjectSettingsDialog";
import { toast } from "sonner";
import { getCapabilities } from "@/services/workspaceAccessService";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Sparkles } from "lucide-react";
import { UpgradeModal } from "@/components/preview/UpgradeModal";
import { clearPendingUpgradeAction, getPendingUpgradeAction, setPendingUpgradeAction } from "@/services/pendingUpgradeAction";

type Device = "desktop" | "laptop" | "tablet" | "mobile";

const DEVICES: { id: Device; label: string; Icon: typeof Monitor; width: string }[] = [
  { id: "desktop", label: "Desktop", Icon: Monitor, width: "w-full" },
  { id: "laptop", label: "Laptop", Icon: Laptop, width: "w-[1280px]" },
  { id: "tablet", label: "Tablet", Icon: Tablet, width: "w-[820px]" },
  { id: "mobile", label: "Mobile", Icon: Smartphone, width: "w-[390px]" },
];

export default function PreviewPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const [role] = useCurrentRole();
  const caps = getCapabilities(role);
  const [device, setDevice] = useState<Device>("desktop");
  const [copied, setCopied] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectName, setProjectName] = useState(getProjectName);
  const [currentSlug, setCurrentSlug] = useState(getProjectSlug);

  useEffect(
    () =>
      subscribeProjectSettings(() => {
        setProjectName(getProjectName());
        setCurrentSlug(getProjectSlug());
      }),
    [],
  );

  useEffect(() => {
    document.title = `${projectName} · Preview`;
  }, [projectName]);

  const resolvedSlug = projectSlug || currentSlug;
  const previewUrl = useMemo(() => `https://${PREVIEW_HOST}/${resolvedSlug}`, [resolvedSlug]);
  const active = DEVICES.find((d) => d.id === device) ?? DEVICES[0];
  const [upgradeOpen, setUpgradeOpen] = useState(!caps.browserPreview);

  // If the user landed here without the capability, remember they were trying
  // to reach browser preview so we can auto-resume after checkout/refresh.
  useEffect(() => {
    if (!caps.browserPreview) {
      setPendingUpgradeAction("browser", resolvedSlug);
    } else {
      const pending = getPendingUpgradeAction();
      if (pending?.reason === "browser") clearPendingUpgradeAction();
    }
  }, [caps.browserPreview, resolvedSlug]);

  if (!caps.browserPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 bg-aurora opacity-30" />
        <div className="relative z-10 max-w-md w-full glass-strong rounded-3xl border border-border p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-gold/40 text-xs text-gold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Pro feature
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Browser preview is a Pro feature
          </h1>
          <p className="text-muted-foreground text-sm mt-3">
            Upgrade to Pro or Business to share full-page browser previews and customize your project URL.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-surface-2 hover:bg-surface-3 transition text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-gold text-background hover:bg-gold/90 transition text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              View plans
            </button>
          </div>
        </div>
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          reason="browser"
          onUpgraded={() => {
            // capability now true; component re-renders into the real browser shell automatically.
            setUpgradeOpen(false);
          }}
        />
      </div>
    );
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Preview link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const reload = () => {
    setReloading(true);
    setIframeKey((k) => k + 1);
    setTimeout(() => setReloading(false), 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-30" />

      {/* Top browser bar */}
      <header className="relative z-10 flex items-center gap-2 px-4 h-14 glass-strong border-b border-border shrink-0">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg hover:bg-surface-2 transition text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Builder
        </Link>

        <div className="hidden md:flex items-center gap-1 ml-2">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-gold/70" />
          <span className="h-3 w-3 rounded-full bg-cyan/70" />
        </div>

        <div className="flex items-center gap-2 px-3 h-9 flex-1 mx-2 rounded-lg bg-background/50 border border-border text-sm text-muted-foreground min-w-0">
          <Lock className="h-3.5 w-3.5 text-cyan shrink-0" />
          <span className="truncate">{previewUrl}</span>
        </div>

        <button
          onClick={reload}
          className="h-9 w-9 grid place-items-center rounded-lg hover:bg-surface-2 transition"
          aria-label="Reload preview"
        >
          <RotateCw className={cn("h-4 w-4 text-muted-foreground transition-transform", reloading && "animate-spin")} />
        </button>

        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg hover:bg-surface-2 transition text-sm text-muted-foreground hover:text-foreground"
          aria-label="Copy preview link"
        >
          {copied ? <Check className="h-4 w-4 text-cyan" /> : <Copy className="h-4 w-4" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy link"}</span>
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg hover:bg-surface-2 transition text-sm text-muted-foreground hover:text-foreground"
          aria-label="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">New tab</span>
        </a>

        <button
          onClick={() => setSettingsOpen(true)}
          className="h-9 w-9 grid place-items-center rounded-lg hover:bg-surface-2 transition"
          aria-label="Project settings"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      {/* Device toolbar */}
      <div className="relative z-10 flex items-center justify-between px-4 h-12 border-b border-border bg-background/40 shrink-0">
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground truncate">
          <span className="text-foreground font-medium">{projectName}</span>
          <span className="mx-2 opacity-50">/</span>
          <span>{resolvedSlug}</span>
        </div>
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-1 border border-border">
          {DEVICES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setDevice(id)}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-md transition text-xs",
                device === id
                  ? "bg-surface-3 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={label}
              aria-pressed={device === id}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main viewport */}
      <main className="relative z-10 flex-1 min-h-0 grid place-items-center p-4 md:p-8 overflow-auto">
        <div
          className={cn(
            "relative h-full max-w-full transition-all duration-500 ease-out",
            active.width,
          )}
        >
          <div className="absolute -inset-3 rounded-3xl bg-button-lumina opacity-20 blur-3xl pointer-events-none" />
          <div
            key={iframeKey}
            className="relative h-full w-full rounded-2xl overflow-hidden bg-background border border-border shadow-[0_40px_120px_-30px_rgb(0_0_0/0.8)]"
          >
            <div className="absolute inset-0 bg-aurora opacity-60" />
            <div className="absolute inset-0 grid place-items-center px-6 text-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs text-muted-foreground mb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_hsl(var(--cyan))]" />
                  Live preview · {active.label}
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight">
                  {projectName}
                </h1>
                <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto">
                  Share <span className="text-foreground">{previewUrl}</span> with clients to give them a live look at this build.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ProjectSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}