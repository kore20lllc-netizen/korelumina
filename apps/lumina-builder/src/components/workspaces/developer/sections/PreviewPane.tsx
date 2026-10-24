import { useState } from "react";
import { ExternalLink, Laptop, RefreshCw, Smartphone, Tablet } from "lucide-react";

import { cn } from "@/lib/utils";

import { toneText } from "../../executive/shared/ExecutiveSection";
import { quietButton } from "../shared/surfaces";
import type { RuntimeControl } from "../state/useRuntimeControl";
import { runtimeLabel } from "../layout/DeveloperCommandDeck";

/*
 * MS-2026-0011: the project's own dev server, framed. Nothing here is
 * gated or promised: the frame shows the server Runtime is running, at
 * the width chosen, and opens it in a new tab.
 */

const WIDTHS = {
  desktop: { label: "Desktop", icon: Laptop, className: "w-full" },
  tablet: { label: "Tablet", icon: Tablet, className: "w-[768px] max-w-full" },
  mobile: { label: "Mobile", icon: Smartphone, className: "w-[390px] max-w-full" },
} as const;

type Width = keyof typeof WIDTHS;

export function PreviewPane({ runtime }: { runtime: RuntimeControl }) {
  const [width, setWidth] = useState<Width>("desktop");
  const ready = runtime.phase === "running" && Boolean(runtime.url);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 px-3 py-2">
        {(Object.keys(WIDTHS) as Width[]).map((key) => {
          const Icon = WIDTHS[key].icon;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setWidth(key)}
              aria-pressed={width === key}
              title={WIDTHS[key].label}
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full border transition",
                width === key ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-transparent text-sky-300/60 hover:text-sky-100",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
        <span className="ml-1 min-w-0 flex-1 truncate text-[11px] text-sky-300/60" title={runtime.url}>
          {runtime.url || "No server address yet"}
        </span>
        <button type="button" onClick={runtime.reloadPreview} disabled={!ready} className={quietButton} title="Reload the frame">
          <RefreshCw className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={() => window.open(runtime.url, "_blank", "noopener,noreferrer")}
          className={quietButton}
          title="Open in a new tab"
        >
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
      <div className="relative flex min-h-[320px] flex-1 justify-center overflow-auto bg-black/20 p-3">
        {ready ? (
          <iframe
            key={`${runtime.url}-${runtime.previewKey}`}
            src={runtime.url}
            title="Project preview"
            className={cn("h-full min-h-[300px] rounded-xl border border-white/10 bg-white", WIDTHS[width].className)}
          />
        ) : (
          <div className="grid w-full place-items-center p-6 text-center">
            <div className="max-w-xs">
              <p className={cn("text-sm font-semibold", runtime.error || runtime.phase === "error" ? toneText.error : "text-sky-100")}>
                {runtimeLabel(runtime.phase)}
              </p>
              <p className="mt-1 text-xs text-sky-300/70">
                {runtime.error ?? (runtime.message || "Runtime starts the project's dev server when you open it.")}
              </p>
              {runtime.phase !== "error" && runtime.phase !== "idle" && runtime.progress > 0 ? (
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-violet-400 transition-all" style={{ width: `${Math.min(100, Math.max(4, runtime.progress))}%` }} />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
