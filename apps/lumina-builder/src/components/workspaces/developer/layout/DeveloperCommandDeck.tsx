import { Code2, FolderDown, RotateCcw, RotateCw, Save, Search, Wand2 } from "lucide-react";

import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { LuminaAIMark } from "@/components/ai/LuminaAIMark";
import { cn } from "@/lib/utils";

import { DesignPreviewBadge, toneDot, toneText } from "../../executive/shared/ExecutiveSection";
import type { DeveloperFiles } from "../state/useDeveloperFiles";
import type { AIAssist } from "../state/useAIAssist";
import type { RuntimeControl } from "../state/useRuntimeControl";
import { pillButton, quietButton, type PillTone } from "../shared/surfaces";

/*
 * MS-2026-0011: the Developer command deck. A compact version of the
 * Executive Office deck, so the editor keeps the room: the project, the
 * file actions, and three live readings (server, open file, AI model).
 */

export function runtimeTone(phase: RuntimeControl["phase"], error: string | null): PillTone {
  if (error || phase === "error") return "error";
  if (phase === "running") return "healthy";
  if (phase === "idle") return "warning";
  return "active";
}

export function runtimeLabel(phase: RuntimeControl["phase"]): string {
  switch (phase) {
    case "running":
      return "Running";
    case "starting":
    case "discovering":
      return "Starting";
    case "waiting-port":
      return "Waiting for port";
    case "rebuilding":
      return "Rebuilding";
    case "error":
      return "Failed";
    default:
      return "Stopped";
  }
}

function Reading({ label, tone, value, detail }: { label: string; tone: PillTone; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/60">{label}</div>
      <div className={cn("mt-1 flex items-center gap-2 text-sm font-semibold", toneText[tone])}>
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[tone])} />
        <span className="truncate">{value}</span>
      </div>
      <div className="mt-0.5 truncate text-[11px] text-sky-300/60" title={detail}>
        {detail}
      </div>
    </div>
  );
}

export function DeveloperCommandDeck({
  projectName,
  files,
  ai,
  runtime,
  onCommand,
  onTransform,
  onExport,
}: {
  projectName: string | null;
  files: DeveloperFiles;
  ai: AIAssist;
  runtime: RuntimeControl;
  onCommand: () => void;
  onTransform: (() => void) | null;
  onExport: () => void;
}) {
  const dirty = files.active ? files.isDirty(files.active) : false;
  const aiReading =
    ai.status.status === "loading"
      ? { tone: "active" as PillTone, value: "Checking", detail: "Asking Runtime which model is set" }
      : ai.status.status === "error"
        ? { tone: "error" as PillTone, value: "Unavailable", detail: ai.status.message }
        : ai.status.data.provider === "rule-based"
          ? { tone: "warning" as PillTone, value: "No AI model", detail: "Rule-based fixes only; set ANTHROPIC_API_KEY in Runtime" }
          : ai.status.data.ready
            ? { tone: "healthy" as PillTone, value: ai.status.data.model ?? ai.status.data.provider ?? "Ready", detail: ai.status.data.provider === "anthropic" ? "Claude drafts your changes" : "OpenAI drafts your changes" }
            : { tone: "error" as PillTone, value: "Not ready", detail: ai.status.data.problem ?? "Model not configured" };

  return (
    <header className="relative min-w-0 overflow-hidden rounded-[28px] border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20 bg-slate-950/[0.48] backdrop-blur-[44px] backdrop-saturate-[170%] shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_30px_rgba(37,99,235,.16),0_28px_160px_rgba(0,0,0,.40),inset_0_0_22px_rgba(56,189,248,.05)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_8%,rgba(217,119,6,.18),transparent_30%),radial-gradient(circle_at_30%_70%,rgba(124,58,237,.20),transparent_34%),radial-gradient(circle_at_95%_90%,rgba(34,211,238,.06),transparent_24%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[7%] top-0 h-px opacity-90 [background:linear-gradient(90deg,transparent_0%,rgba(96,165,250,.10)_12%,rgba(247,215,116,.42)_34%,rgba(255,255,255,.62)_50%,rgba(125,211,252,.28)_69%,rgba(59,130,246,.08)_88%,transparent_100%)]"
      />
      <div className="relative z-10 grid gap-5 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center gap-4">
            <ExecutivePremiumIcon icon={Code2} state="active" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/80">
                  Workspace
                </span>
                <DesignPreviewBadge wiring="live" />
              </div>
              <h1 className="mt-2 truncate text-3xl font-black tracking-[-0.04em]">
                <span className="text-gradient-lumina">Developer</span>{" "}
                <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">
                  {projectName ?? "No project"}
                </span>
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void files.save()} disabled={!files.active || !dirty || files.saving} className={pillButton("healthy")}>
              <Save className="h-3 w-3" /> {files.saving ? "Saving" : "Save"}
            </button>
            <button type="button" onClick={files.revert} disabled={!files.active || !dirty} className={pillButton("warning")}>
              <RotateCcw className="h-3 w-3" /> Revert
            </button>
            <button type="button" onClick={() => void runtime.restart()} disabled={!files.projectId || runtime.restarting} className={pillButton("active")}>
              <RotateCw className={cn("h-3 w-3", runtime.restarting && "animate-spin")} /> {runtime.restarting ? "Restarting" : "Restart server"}
            </button>
            {onTransform ? (
              <button type="button" onClick={onTransform} disabled={!files.projectId} className={pillButton("warning")}>
                <Wand2 className="h-3 w-3" /> Transform to website
              </button>
            ) : null}
            <button type="button" onClick={onExport} disabled={!files.projectId} className={quietButton}>
              <FolderDown className="h-3 w-3" /> Export
            </button>
            <button type="button" onClick={onCommand} className={quietButton}>
              <Search className="h-3 w-3" /> Command
            </button>
          </div>
          {files.saveError || runtime.restartError ? (
            <p role="alert" className={cn("text-xs", toneText.error)}>
              {files.saveError ?? runtime.restartError}
            </p>
          ) : null}
        </div>
        <div className="grid min-w-0 content-start gap-3 sm:grid-cols-3">
          <Reading
            label="Server"
            tone={runtimeTone(runtime.phase, runtime.error)}
            value={runtimeLabel(runtime.phase)}
            detail={runtime.error ?? (runtime.message || (runtime.url ? runtime.url : "Not started"))}
          />
          <Reading
            label="Open file"
            tone={!files.active ? "warning" : dirty ? "warning" : "healthy"}
            value={files.active ? files.active.split("/").pop() ?? files.active : "None"}
            detail={files.active ? `${dirty ? "Unsaved edits" : "Saved"} · ${files.active}` : "Choose a file in the explorer"}
          />
          <div className="relative min-w-0">
            <Reading label="AI" tone={aiReading.tone} value={aiReading.value} detail={aiReading.detail} />
            <span className="absolute right-3 top-3">
              <LuminaAIMark working={ai.working} className="h-6 w-6" workingClassName="h-9 w-9" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
