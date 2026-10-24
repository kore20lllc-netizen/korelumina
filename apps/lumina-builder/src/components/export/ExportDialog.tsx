import { useEffect, useState } from "react";
import { Download, FolderDown, GitBranch, KeyRound } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { cn } from "@/lib/utils";
import { downloadProjectZip, getProjectExportSummary, type ProjectExportSummary } from "@/services/runtime/projectExport";

import { tonePill, toneText } from "../workspaces/executive/shared/ExecutiveSection";

/*
 * MS-2026-0017 (ADR-0047): take a project out of KoreLumina. The
 * download holds the project as it is now, with everything KoreLumina
 * changed; .env files are left out and named, because they hold keys.
 * Saving to the customer's own GitHub comes with Connected accounts.
 */

function size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const REASON: Record<string, string> = {
  project_not_found: "This project is not available to your account.",
  forbidden: "Only the project's owner can export it.",
  export_too_large: "The project is over 500 MB without dependencies and builds, too large to download here.",
  export_too_many_files: "The project has more than 50,000 files without dependencies and builds.",
};

type State =
  | { status: "reading" }
  | { status: "ready"; summary: ProjectExportSummary }
  | { status: "downloading"; summary: ProjectExportSummary }
  | { status: "saved"; summary: ProjectExportSummary; bytes: number }
  | { status: "error"; message: string; summary: ProjectExportSummary | null };

export function ExportDialog({
  project,
  onClose,
}: {
  project: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const [state, setState] = useState<State>({ status: "reading" });

  const projectId = project?.id ?? null;

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setState({ status: "reading" });
    getProjectExportSummary(projectId)
      .then((summary) => !cancelled && setState({ status: "ready", summary }))
      .catch((error: unknown) => {
        if (cancelled) return;
        const code = error instanceof Error ? error.message : "export_unavailable";
        setState({ status: "error", message: REASON[code] ?? "Runtime could not prepare the download.", summary: null });
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const summary = "summary" in state ? state.summary : null;

  const download = async () => {
    if (!project || !summary) return;
    setState({ status: "downloading", summary });
    try {
      const bytes = await downloadProjectZip(project.id);
      setState({ status: "saved", summary, bytes });
    } catch (error) {
      const code = error instanceof Error ? error.message : "export_failed";
      setState({ status: "error", message: REASON[code] ?? "The download did not complete. Try again.", summary });
    }
  };

  return (
    <Dialog open={Boolean(project)} onOpenChange={(next) => !next && state.status !== "downloading" && onClose()}>
      <DialogContent className="max-w-xl rounded-[28px] border border-blue-400/60 bg-slate-950/95 p-0 text-white shadow-[0_0_30px_rgba(37,99,235,.18),0_28px_160px_rgba(0,0,0,.5)] backdrop-blur-[44px]">
        <div className="relative grid gap-5 p-7">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-4">
              <ExecutivePremiumIcon icon={FolderDown} state="active" />
              <div className="min-w-0">
                <DialogTitle className="text-2xl font-black tracking-[-0.03em]">
                  <span className="text-gradient-lumina">Take</span>{" "}
                  <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">your project</span>
                </DialogTitle>
                <DialogDescription className="mt-1 truncate text-sm text-sky-300/70">
                  {project?.name}: yours, with everything changed in KoreLumina.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Download</div>
            {state.status === "reading" ? <p className="text-sm text-sky-300/70">Reading the project…</p> : null}
            {summary ? (
              <p className="text-sm text-sky-100">
                {summary.fileCount} files, {size(summary.totalBytes)}, as a .zip. Dependencies and build output are left out; they are rebuilt with an install.
              </p>
            ) : null}
            {summary && summary.leftOutSecrets.length > 0 ? (
              <div className={cn("flex gap-3 rounded-xl border px-3 py-2.5 text-xs", tonePill.warning)}>
                <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <p>Left out because they hold keys: {summary.leftOutSecrets.join(", ")}. Set those values again wherever you run or deploy the project.</p>
                </div>
              </div>
            ) : null}
            {summary && summary.leftOutLinks.length > 0 ? (
              <p className="text-xs text-sky-300/60">Shortcut links left out: {summary.leftOutLinks.join(", ")}.</p>
            ) : null}
            {state.status === "error" ? <p className={cn("text-sm", toneText.error)}>{state.message}</p> : null}
            {state.status === "saved" ? <p className={cn("text-sm", toneText.healthy)}>Saved {project?.id}.zip ({size(state.bytes)}) to your downloads.</p> : null}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void download()}
                disabled={!summary || state.status === "downloading"}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 ${tonePill.healthy}`}
              >
                <Download className="h-3 w-3" /> {state.status === "downloading" ? "Preparing" : state.status === "saved" ? "Download again" : "Download .zip"}
              </button>
            </div>
          </section>

          <section className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-sky-300/50" />
            <p className="text-xs text-sky-300/60">Saving straight to your own GitHub, as a new private repository or a pull request, arrives with Connected accounts.</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
