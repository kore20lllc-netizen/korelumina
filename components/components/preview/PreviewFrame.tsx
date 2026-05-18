import { RotateCw, ExternalLink, Smartphone, Monitor, Tablet, Lock, Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const displayUrl = url ?? "korelumina.app/preview";
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

        <button
          onClick={handleOpenExternal}
          disabled={!navigableUrl}
          className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <button
          onClick={() => setFullscreen((v) => !v)}
          className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition"
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {fullscreen ? (
            <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
          )}
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
