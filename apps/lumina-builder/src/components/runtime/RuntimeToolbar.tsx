import { isRuntimeManuallyStopped } from "@/services/runtime/manualStop";
import {
  ExternalLink,
  Play,
  RotateCw,
  Square,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  getRuntimeStatus,
  restartRuntime,
  startRuntime,
  stopRuntime,
  type RuntimeSession,
} from "@/services/runtimeService";

interface RuntimeToolbarProps {
  projectId: string;
}

export function RuntimeToolbar({
  projectId,
}: RuntimeToolbarProps) {
  const [
    runtime,
    setRuntime,
  ] = useState<RuntimeSession | null>(
    null,
  );

  const [
    busy,
    setBusy,
  ] = useState(false);

  async function refresh() {
    if (
      isRuntimeManuallyStopped(
        projectId,
      )
    ) {
      setRuntime(null);
      return;
    }

    const next =
      await getRuntimeStatus(
        projectId,
      );

    setRuntime(next);
  }

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (
        isRuntimeManuallyStopped(
          projectId,
        )
      ) {
        if (!cancelled) {
          setRuntime(null);
        }

        return;
      }

      const next =
        await getRuntimeStatus(
          projectId,
        );

      if (!cancelled) {
        setRuntime(next);
      }
    }

    void tick();

    const interval =
      window.setInterval(
        tick,
        5000,
      );

    return () => {
      cancelled = true;
      window.clearInterval(
        interval,
      );
    };
  }, [projectId]);

  async function runAction(
    success: string,
    action: () => Promise<unknown>,
  ) {
    try {
      setBusy(true);
      await action();
      await refresh();
      toast.success(success);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : success,
      );
    } finally {
      setBusy(false);
    }
  }

  const status =
    runtime?.status ?? "stopped";

  const isRunning =
    status === "running";

  const isStarting =
    status === "starting";

  const isError =
    status === "error";

  const statusLabel =
    isRunning
      ? "Running"
      : isStarting
        ? "Starting"
        : isError
          ? "Error"
          : "Stopped";

  return (
    <div className="hidden lg:flex items-center gap-1.5 h-8 px-1.5 rounded-xl bg-surface-1 border border-border">
      <div
        className="inline-flex items-center gap-1.5 px-2 min-w-[112px] text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
        title={runtime?.url ?? "Runtime stopped"}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isRunning &&
              "bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153/0.75)]",
            isStarting &&
              "bg-amber-300 shadow-[0_0_8px_rgb(252_211_77/0.75)]",
            isError &&
              "bg-rose-400 shadow-[0_0_8px_rgb(251_113_133/0.75)]",
            !isRunning &&
              !isStarting &&
              !isError &&
              "bg-muted-foreground/40",
          )}
        />
        <span>{statusLabel}</span>
        {runtime?.port ? (
          <span className="text-muted-foreground/60">
            :{runtime.port}
          </span>
        ) : null}
      </div>

      <button
        disabled={busy || isRunning || isStarting}
        onClick={() =>
          runAction(
            "Runtime started",
            () =>
              startRuntime(
                projectId,
              ),
          )
        }
        className="h-7 w-7 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 disabled:opacity-35 disabled:cursor-not-allowed transition"
        title="Start runtime"
        aria-label="Start runtime"
      >
        <Play className="h-3.5 w-3.5" />
      </button>

      <button
        disabled={busy || !runtime}
        onClick={() =>
          runAction(
            "Runtime restarted",
            () =>
              restartRuntime(
                projectId,
              ),
          )
        }
        className="h-7 w-7 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 disabled:opacity-35 disabled:cursor-not-allowed transition"
        title="Restart runtime"
        aria-label="Restart runtime"
      >
        <RotateCw className="h-3.5 w-3.5" />
      </button>

      <button
        disabled={busy || !runtime}
        onClick={() =>
          runAction(
            "Runtime stopped",
            async () => {
              await stopRuntime(
                projectId,
              );

              setRuntime(null);

              window.dispatchEvent(
                new CustomEvent(
                  "lumina:runtime-stopped",
                  {
                    detail: {
                      projectId,
                    },
                  },
                ),
              );
            },
          )
        }
        className="h-7 w-7 grid place-items-center rounded-lg text-muted-foreground hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-35 disabled:cursor-not-allowed transition"
        title="Stop runtime"
        aria-label="Stop runtime"
      >
        <Square className="h-3.5 w-3.5" />
      </button>

      <button
        disabled={!runtime?.url}
        onClick={() => {
          if (!runtime?.url) return;

          window.open(
            runtime.url,
            "_blank",
            "noopener,noreferrer",
          );
        }}
        className="h-7 w-7 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 disabled:opacity-35 disabled:cursor-not-allowed transition"
        title="Open runtime"
        aria-label="Open runtime"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
