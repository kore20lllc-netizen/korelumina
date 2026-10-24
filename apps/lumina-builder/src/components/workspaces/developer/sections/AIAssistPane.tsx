import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, FilePlus2, FileX2, PenLine, SendHorizontal, Undo2, X } from "lucide-react";

import { LuminaAIMark } from "@/components/ai/LuminaAIMark";
import { cn } from "@/lib/utils";

import { tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { pillButton, quietButton } from "../shared/surfaces";
import type { RuntimeDraftPatch } from "@/services/runtime/drafts";
import type { AIAssist, AITurn } from "../state/useAIAssist";
import type { DeveloperFiles } from "../state/useDeveloperFiles";

/*
 * MS-2026-0011: AI Assist. The person asks in their own words; the model
 * drafts the change; every file it would touch is shown as a diff; nothing
 * is written until Apply. While it works, the KoreLumina AI shows as the
 * living Lumina form.
 */

function focusLabel(focus: AITurn["focus"]): string | null {
  if (!focus) return null;
  const name = focus.file.split("/").pop() ?? focus.file;
  if (focus.startLine === undefined) return name;
  return `${name} · L${focus.startLine}${focus.endLine !== focus.startLine ? `–L${focus.endLine}` : ""}`;
}

function DiffLines({ removed, added }: { removed: string | null; added: string | null }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-5">
      {removed !== null
        ? removed.split("\n").map((line, index) => (
            <div key={`r${index}`} className="whitespace-pre-wrap break-words bg-rose-500/10 text-rose-200">
              <span className="select-none text-rose-300/60">- </span>
              {line}
            </div>
          ))
        : null}
      {added !== null
        ? added.split("\n").map((line, index) => (
            <div key={`a${index}`} className="whitespace-pre-wrap break-words bg-emerald-500/10 text-emerald-200">
              <span className="select-none text-emerald-300/60">+ </span>
              {line}
            </div>
          ))
        : null}
    </pre>
  );
}

function PatchView({ patch }: { patch: RuntimeDraftPatch }) {
  const [open, setOpen] = useState(true);
  const Icon = patch.type === "create-file" ? FilePlus2 : patch.type === "delete-file" ? FileX2 : PenLine;
  const verb = patch.type === "create-file" ? "Create" : patch.type === "delete-file" ? "Delete" : "Edit";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-2 px-3 py-2 text-left">
        {open ? <ChevronDown className="h-3 w-3 text-sky-300/60" /> : <ChevronRight className="h-3 w-3 text-sky-300/60" />}
        <Icon className="h-3.5 w-3.5 text-cyan-300" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/70">{verb}</span>
        <span className="min-w-0 truncate text-xs text-sky-100" title={patch.file}>
          {patch.file}
        </span>
      </button>
      {open ? (
        <div className="px-3 pb-3">
          {patch.type === "replace-text" ? <DiffLines removed={patch.find ?? ""} added={patch.replace ?? ""} /> : null}
          {patch.type === "create-file" ? <DiffLines removed={null} added={patch.content ?? ""} /> : null}
          {patch.type === "delete-file" ? <p className="text-xs text-rose-200/80">The whole file is removed.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function TurnView({ turn, ai, files }: { turn: AITurn; ai: AIAssist; files: DeveloperFiles }) {
  const patches = turn.draft?.patches ?? [];
  const blockedByEdits = files.dirtyFiles.length > 0;
  const label = focusLabel(turn.focus);
  const ruleBased = turn.provider === "rule-based";

  return (
    <li className="grid gap-3">
      <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md border border-cyan-300/20 bg-cyan-400/[0.07] px-3.5 py-2.5 text-sm text-sky-50">
        {label ? <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70">{label}</div> : null}
        <p className="whitespace-pre-wrap break-words">{turn.prompt}</p>
      </div>

      <div className="flex gap-3">
        <div className="pt-0.5">
          <LuminaAIMark working={turn.state === "working"} className="h-7 w-7" workingClassName="h-12 w-12" />
        </div>
        <div className="grid min-w-0 flex-1 gap-2.5 text-sm text-sky-100/90">
          {turn.state === "working" ? <p className="pt-3 text-sky-300/70">Reading the project and drafting the change…</p> : null}

          {turn.summary ? <p className="whitespace-pre-wrap break-words leading-6">{turn.summary}</p> : null}
          {ruleBased ? (
            <p className={cn("rounded-xl border px-3 py-2 text-xs", tonePill.warning)}>
              No AI model is set in Runtime, so these are the audit's rule-based fixes, not an answer to what you asked.
            </p>
          ) : null}
          {turn.note && !ruleBased ? <p className={cn("text-xs", toneText.warning)}>{turn.note}</p> : null}
          {turn.rejected.length > 0 ? (
            <ul className={cn("grid gap-1 text-xs", toneText.warning)}>
              {turn.rejected.map((reason, index) => (
                <li key={index}>· Left out: {reason}</li>
              ))}
            </ul>
          ) : null}

          {turn.state !== "working" && turn.state !== "failed" && patches.length === 0 ? (
            <p className="text-xs text-sky-300/60">No file changes proposed.</p>
          ) : null}
          {patches.length > 0 && turn.state !== "discarded" ? (
            <div className="grid gap-2">
              {patches.map((patch, index) => (
                <PatchView key={`${patch.file}-${index}`} patch={patch} />
              ))}
            </div>
          ) : null}

          {turn.error ? (
            <div className={cn("rounded-xl border px-3 py-2 text-xs", tonePill.error)}>
              <p>{turn.error}</p>
              {turn.reasons.length > 0 ? (
                <ul className="mt-1 grid gap-0.5">
                  {turn.reasons.map((reason, index) => (
                    <li key={index}>· {reason}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {patches.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {turn.state === "ready" || turn.state === "applying" ? (
                <>
                  <button type="button" onClick={() => void ai.apply(turn)} disabled={turn.state === "applying" || blockedByEdits} className={pillButton("healthy")}>
                    <Check className="h-3 w-3" /> {turn.state === "applying" ? "Applying" : `Apply ${patches.length} change${patches.length === 1 ? "" : "s"}`}
                  </button>
                  <button type="button" onClick={() => ai.discard(turn)} disabled={turn.state === "applying"} className={quietButton}>
                    <X className="h-3 w-3" /> Discard
                  </button>
                </>
              ) : null}
              {turn.state === "applied" || turn.state === "reverting" ? (
                <>
                  <span className={cn("text-xs", toneText.healthy)}>Applied.</span>
                  <button type="button" onClick={() => void ai.revert(turn)} disabled={turn.state === "reverting" || blockedByEdits} className={pillButton("warning")}>
                    <Undo2 className="h-3 w-3" /> {turn.state === "reverting" ? "Undoing" : "Undo"}
                  </button>
                </>
              ) : null}
              {turn.state === "reverted" ? <span className="text-xs text-sky-300/70">Undone. The files are as they were.</span> : null}
              {turn.state === "discarded" ? <span className="text-xs text-sky-300/60">Discarded. Nothing was written.</span> : null}
              {blockedByEdits && (turn.state === "ready" || turn.state === "applied") ? (
                <span className={cn("text-[11px]", toneText.warning)}>Save or revert your edits first.</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function AIAssistPane({ ai, files }: { ai: AIAssist; files: DeveloperFiles }) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [ai.turns]);

  const selection = files.selection;
  const focus = files.active
    ? ai.useSelection && selection
      ? `${files.active.split("/").pop()} · L${selection.startLine}${selection.endLine !== selection.startLine ? `–L${selection.endLine}` : ""}`
      : files.active.split("/").pop()
    : null;
  const canAsk = Boolean(ai.prompt.trim()) && !ai.working && !ai.blockedReason;

  return (
    <div className="flex min-h-[420px] flex-1 flex-col">
      <div ref={list} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {ai.turns.length === 0 ? (
          <div className="grid place-items-center gap-3 py-10 text-center">
            <LuminaAIMark className="h-12 w-12" />
            <p className="max-w-xs text-sm text-sky-100">Describe a change. KoreLumina AI drafts it and shows every line before anything is written.</p>
            <p className="max-w-xs text-xs text-sky-300/60">It reads the open file first. Select lines in the editor to point it at them.</p>
          </div>
        ) : (
          <ol className="grid gap-6">
            {ai.turns.map((turn) => (
              <TurnView key={turn.id} turn={turn} ai={ai} files={files} />
            ))}
          </ol>
        )}
      </div>

      <form
        className="grid gap-2 border-t border-white/10 bg-black/20 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void ai.ask();
        }}
      >
        {focus ? (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-sky-300/70">
            <span>Focus:</span>
            <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-0.5 text-cyan-100">{focus}</span>
            {selection ? (
              <label className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={ai.useSelection} onChange={(event) => ai.setUseSelection(event.target.checked)} className="accent-cyan-400" />
                selected lines only
              </label>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={ai.prompt}
            onChange={(event) => ai.setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void ai.ask();
              }
            }}
            rows={2}
            placeholder="e.g. Add a loading state to the submit button"
            aria-label="Describe a change"
            className="min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-sky-50 placeholder:text-sky-300/40 focus:border-cyan-300/40 focus:outline-none"
          />
          <button type="submit" disabled={!canAsk} className={cn(pillButton("active"), "h-10")} aria-label="Ask KoreLumina AI">
            <SendHorizontal className="h-3.5 w-3.5" /> Ask
          </button>
        </div>
        {ai.blockedReason ? <p className={cn("text-[11px]", toneText.warning)}>{ai.blockedReason}</p> : null}
      </form>
    </div>
  );
}
