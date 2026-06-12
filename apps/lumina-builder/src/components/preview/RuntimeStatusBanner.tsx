import { useEffect, useState } from "react";

interface RuntimeStatusBannerProps {
  phase: string;
  message?: string;
  projectId?: string | null;
  url?: string;
}

export function RuntimeStatusBanner({
  phase,
  message,
  projectId,
  url,
}: RuntimeStatusBannerProps) {
  const [visible, setVisible] =
    useState(false);

  useEffect(() => {
    if (
      phase === "running" ||
      phase === "starting" ||
      phase === "discovering" ||
      phase === "waiting-port" ||
      phase === "rebuilding"
    ) {
      setVisible(true);
    }

    if (
      phase === "running"
    ) {
      const timer =
        window.setTimeout(
          () => setVisible(false),
          3000,
        );

      return () =>
        clearTimeout(timer);
    }
  }, [phase]);

  if (!visible) {
    return null;
  }

  const title =
    phase === "discovering"
      ? "Discovering Runtime"
      : phase === "starting"
        ? "Starting Runtime"
        : phase ===
            "waiting-port"
          ? "Waiting For Preview Server"
          : phase ===
              "rebuilding"
            ? "Refreshing Preview"
            : "Preview Ready";

  return (
    <div className="absolute top-3 right-3 z-50 pointer-events-none">
      <div className="rounded-xl border bg-background/95 backdrop-blur shadow-lg px-4 py-3 min-w-[280px]">
        <div className="font-medium">
          {phase === "running"
            ? "✓"
            : "•"}{" "}
          {title}
        </div>

        {projectId && (
          <div className="text-xs text-muted-foreground mt-1">
            Project: {projectId}
          </div>
        )}

        {url &&
          phase ===
            "running" && (
            <div className="text-xs text-muted-foreground">
              {url}
            </div>
          )}

        {message && (
          <div className="text-xs text-muted-foreground mt-2">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
