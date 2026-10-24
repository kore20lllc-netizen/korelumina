import { useState } from "react";
import { ChevronDown, ChevronRight, FilePlus2, PenLine } from "lucide-react";

import type { RuntimeDraftPatch } from "@/services/runtime/drafts";

/* MS-2026-0011: every file the website draft would create or change, in full. */

function Lines({ text, tone }: { text: string; tone: "add" | "remove" }) {
  return (
    <>
      {text.split("\n").map((line, index) => (
        <div
          key={`${tone}${index}`}
          className={tone === "add" ? "whitespace-pre-wrap break-words bg-emerald-500/10 text-emerald-200" : "whitespace-pre-wrap break-words bg-rose-500/10 text-rose-200"}
        >
          <span className={tone === "add" ? "select-none text-emerald-300/60" : "select-none text-rose-300/60"}>{tone === "add" ? "+ " : "- "}</span>
          {line}
        </div>
      ))}
    </>
  );
}

function PatchRow({ patch, startOpen }: { patch: RuntimeDraftPatch; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const created = patch.type === "create-file";
  const Icon = created ? FilePlus2 : PenLine;
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left">
        {open ? <ChevronDown className="h-3.5 w-3.5 text-sky-300/60" /> : <ChevronRight className="h-3.5 w-3.5 text-sky-300/60" />}
        <Icon className="h-3.5 w-3.5 text-cyan-300" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/70">{created ? "New file" : "Edit"}</span>
        <span className="min-w-0 truncate font-mono text-xs text-sky-100" title={patch.file}>
          {patch.file}
        </span>
      </button>
      {open ? (
        <pre className="mx-4 mb-4 max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-5">
          {created ? <Lines text={patch.content ?? ""} tone="add" /> : null}
          {patch.type === "replace-text" ? (
            <>
              <Lines text={patch.find ?? ""} tone="remove" />
              <Lines text={patch.replace ?? ""} tone="add" />
            </>
          ) : null}
        </pre>
      ) : null}
    </li>
  );
}

export function TransformDraftView({ patches }: { patches: RuntimeDraftPatch[] }) {
  return (
    <ul className="grid gap-2">
      {patches.map((patch, index) => (
        <PatchRow key={`${patch.file}-${index}`} patch={patch} startOpen={patch.type === "replace-text"} />
      ))}
    </ul>
  );
}
