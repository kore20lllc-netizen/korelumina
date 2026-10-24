import { Wand2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { useTransform } from "@/context/TransformContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";

import { AnalysisView, BlockedView, BuildView, DoneView, ErrorView, PlanView, ReviewView, Working } from "./sections/TransformStages";
import { useWebsiteTransform, type TransformStage } from "./state/useWebsiteTransform";

/*
 * MS-2026-0011: Transform App -> Website, real. Runtime analyses the
 * project, the AI plans and writes the pages inside the app, reusing its
 * components and styles, and the owner reads the whole draft before it is
 * applied (all or nothing, with undo). It replaces a wizard whose analysis
 * was a timer, whose plan was a fixed list, and whose Apply wrote
 * placeholder pages over the project's files without asking.
 */

const STEPS: Array<{ label: string; stages: TransformStage[] }> = [
  { label: "Analyze", stages: ["analyzing", "ready", "locked", "unsupported", "no-model"] },
  { label: "Plan", stages: ["planning", "plan"] },
  { label: "Build", stages: ["building"] },
  { label: "Review", stages: ["review", "applying"] },
  { label: "Done", stages: ["applied", "reverting", "reverted"] },
];

function Stepper({ stage }: { stage: TransformStage }) {
  const current = STEPS.findIndex((step) => step.stages.includes(stage));
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((step, index) => (
        <li
          key={step.label}
          className={cn(
            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
            index === current
              ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100"
              : index < current
                ? "border-emerald-300/25 text-emerald-200/80"
                : "border-white/10 text-sky-300/50",
          )}
        >
          {step.label}
        </li>
      ))}
    </ol>
  );
}

export function TransformModal() {
  const { open, payload, closeTransform } = useTransform();
  const { activeProject } = useWorkspace();
  const project = payload?.project ?? activeProject ?? null;
  const t = useWebsiteTransform(project?.id ?? null, open);
  const busy = t.stage === "applying" || t.stage === "reverting";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && closeTransform()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[28px] border border-blue-400/60 bg-slate-950/95 p-0 text-white shadow-[0_0_30px_rgba(37,99,235,.18),0_28px_160px_rgba(0,0,0,.5)] backdrop-blur-[44px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_6%_8%,rgba(217,119,6,.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,.16),transparent_34%)]"
        />
        <div className="relative grid gap-6 p-7">
          <DialogHeader className="space-y-4 text-left">
            <div className="flex items-center gap-4">
              <ExecutivePremiumIcon icon={Wand2} state="active" />
              <div className="min-w-0">
                <DialogTitle className="text-2xl font-black tracking-[-0.03em]">
                  <span className="text-gradient-lumina">Transform</span>{" "}
                  <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">App → Website</span>
                </DialogTitle>
                <DialogDescription className="mt-1 truncate text-sm text-sky-300/70">
                  {project ? `A website inside ${project.name}, built from its own code and styles.` : "Open a project first."}
                </DialogDescription>
              </div>
            </div>
            <Stepper stage={t.stage} />
          </DialogHeader>

          {!project ? <p className="text-sm text-sky-300/70">Choose a project in Projects, then open Transform again.</p> : null}
          {project && t.stage === "analyzing" ? <Working title="Reading the project" detail="Finding its framework, routes, components and styles." /> : null}
          {project && t.stage === "ready" ? <AnalysisView t={t} /> : null}
          {project && (t.stage === "locked" || t.stage === "unsupported" || t.stage === "no-model") ? <BlockedView t={t} /> : null}
          {project && t.stage === "planning" ? <Working title="Planning the website" detail="The AI reads the README, routes and components and proposes the pages." /> : null}
          {project && t.stage === "plan" ? <PlanView t={t} /> : null}
          {project && t.stage === "building" ? <BuildView t={t} /> : null}
          {project && (t.stage === "review" || t.stage === "applying") ? <ReviewView t={t} /> : null}
          {project && (t.stage === "applied" || t.stage === "reverting" || t.stage === "reverted") ? <DoneView t={t} onClose={closeTransform} /> : null}
          {project && t.stage === "error" ? <ErrorView t={t} /> : null}
          {t.error && t.stage !== "error" ? <p className="text-xs text-rose-200">{t.error.text}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TransformModal;
