import { Eye, ScrollText } from "lucide-react";

import { LuminaAIMark } from "@/components/ai/LuminaAIMark";
import { cn } from "@/lib/utils";

import { panelReflection, panelSurface } from "../shared/surfaces";
import type { AIAssist } from "../state/useAIAssist";
import type { DeveloperFiles } from "../state/useDeveloperFiles";
import type { RuntimeControl } from "../state/useRuntimeControl";
import { AIAssistPane } from "./AIAssistPane";
import { LogsPane } from "./LogsPane";
import { PreviewPane } from "./PreviewPane";

export type SideTab = "preview" | "logs" | "ai";

/* MS-2026-0011: the right-hand panel: the running app, its output, and AI Assist. */
export function SidePanel({
  tab,
  setTab,
  runtime,
  ai,
  files,
}: {
  tab: SideTab;
  setTab: (tab: SideTab) => void;
  runtime: RuntimeControl;
  ai: AIAssist;
  files: DeveloperFiles;
}) {
  const tabs: Array<{ id: SideTab; label: string; icon: JSX.Element }> = [
    { id: "preview", label: "Preview", icon: <Eye className="h-3.5 w-3.5" /> },
    { id: "logs", label: "Logs", icon: <ScrollText className="h-3.5 w-3.5" /> },
    { id: "ai", label: "AI Assist", icon: <LuminaAIMark working={false} className="h-4 w-4" /> },
  ];

  return (
    <aside aria-label="Preview, logs and AI Assist" className={cn(panelSurface, "min-h-[460px] w-full lg:w-[420px] xl:w-[480px] lg:shrink-0")}>
      <div aria-hidden="true" className={panelReflection} />
      <div role="tablist" className="flex items-center gap-1 border-b border-white/10 px-3 pt-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "relative inline-flex h-9 items-center gap-2 rounded-t-xl px-3.5 text-xs font-semibold transition",
              tab === item.id ? "bg-white/[0.06] text-sky-50" : "text-sky-300/60 hover:text-sky-100",
            )}
          >
            {item.icon}
            {item.label}
            {item.id === "ai" && ai.working ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300" aria-label="Working" /> : null}
            {tab === item.id ? <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-amber-300/70 via-cyan-300 to-violet-400/70" /> : null}
          </button>
        ))}
      </div>
      {tab === "preview" ? <PreviewPane runtime={runtime} /> : null}
      {tab === "logs" ? <LogsPane runtime={runtime} /> : null}
      {tab === "ai" ? <AIAssistPane ai={ai} files={files} /> : null}
    </aside>
  );
}
