import { CheckCircle2, CircleDashed, Loader2, Lock, RotateCcw, Undo2, XCircle } from "lucide-react";

import { LuminaAIMark } from "@/components/ai/LuminaAIMark";
import { cn } from "@/lib/utils";

import { tonePill, toneText } from "@/components/workspaces/executive/shared/ExecutiveSection";
import type { WebsiteTransform } from "../state/useWebsiteTransform";
import { describeTransformError } from "../state/useWebsiteTransform";
import { TransformDraftView } from "./TransformDraftView";

/*
 * MS-2026-0011: the Transform wizard's screens. Each shows only what
 * Runtime returned: the analysis, the model's plan, the build's real
 * steps, and the full draft before anything is written.
 */

const pill = (tone: keyof typeof tonePill) =>
  `inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 ${tonePill[tone]}`;
const quiet =
  "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200/80 transition hover:border-cyan-300/30 hover:text-cyan-100 disabled:opacity-40";
const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const eyebrow = "text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80";

function Working({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid place-items-center gap-3 py-10 text-center">
      <LuminaAIMark working workingClassName="h-20 w-20" />
      <p className="text-base font-semibold text-sky-50">{title}</p>
      <p className="max-w-md text-sm text-sky-300/70">{detail}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={card}>
      <div className={eyebrow}>{label}</div>
      <div className="mt-1 text-sm text-sky-50">{value}</div>
    </div>
  );
}

export function AnalysisView({ t }: { t: WebsiteTransform }) {
  const analysis = t.analysis;
  if (!analysis) return null;
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Fact label="Framework" value={analysis.frameworkLabel} />
        <Fact label="Styling" value={analysis.styling.join(", ") || "Plain CSS"} />
        <Fact label="Existing" value={`${analysis.existingRoutes.length} routes · ${analysis.components.length} components`} />
      </div>
      {analysis.existingRoutes.length > 0 ? (
        <div className={card}>
          <div className={eyebrow}>Routes the app already uses (kept as they are)</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {analysis.existingRoutes.slice(0, 30).map((route) => (
              <span key={route} className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[11px] text-sky-200/80">
                {route}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {t.stage === "ready" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-sky-300/70">KoreLumina AI{t.model ? ` (${t.model})` : ""} reads the project and proposes the website's pages. Nothing is written yet.</p>
          <button type="button" onClick={() => void t.makePlan()} className={pill("active")}>
            Plan the website
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function BlockedView({ t }: { t: WebsiteTransform }) {
  if (t.stage === "locked") {
    return (
      <div className="grid place-items-center gap-4 py-8 text-center">
        <span className={cn("grid h-14 w-14 place-items-center rounded-full border", tonePill.warning)}>
          <Lock className="h-6 w-6" />
        </span>
        <p className="text-lg font-semibold text-sky-50">Transform is included from Pro</p>
        <p className="max-w-md text-sm text-sky-300/70">
          A one-time $49 unlock for a single project is coming with checkout. It is not available to buy yet, so nothing is charged here.
        </p>
      </div>
    );
  }
  if (t.stage === "unsupported") {
    return (
      <div className="grid gap-4">
        <AnalysisView t={t} />
        <p className={cn("rounded-2xl border px-4 py-3 text-sm", tonePill.warning)}>{t.analysis?.reason}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <AnalysisView t={t} />
      <p className={cn("rounded-2xl border px-4 py-3 text-sm", tonePill.warning)}>{describeTransformError("transform_needs_ai_model")}</p>
    </div>
  );
}

export function PlanView({ t }: { t: WebsiteTransform }) {
  const chosen = t.pages.filter((page) => page.chosen).length;
  return (
    <div className="grid gap-4">
      {t.plan?.summary ? (
        <div className="flex gap-3">
          <LuminaAIMark className="h-8 w-8" />
          <p className="text-sm leading-6 text-sky-100/90">{t.plan.summary}</p>
        </div>
      ) : null}
      <ul className="grid gap-2">
        {t.pages.map((page) => (
          <li key={page.id} className={cn(card, "grid gap-2", !page.chosen && "opacity-50")}>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="checkbox"
                checked={page.chosen}
                onChange={(event) => t.updatePage(page.id, { chosen: event.target.checked })}
                aria-label={`Include ${page.title}`}
                className="h-4 w-4 accent-cyan-400"
              />
              <input
                value={page.title}
                onChange={(event) => t.updatePage(page.id, { title: event.target.value })}
                aria-label="Page title"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-sky-50 focus:outline-none"
              />
              <input
                value={page.route}
                onChange={(event) => t.updatePage(page.id, { route: event.target.value.toLowerCase() })}
                aria-label="Page address"
                className="w-36 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-xs text-cyan-100 focus:border-cyan-300/40 focus:outline-none"
              />
            </div>
            {page.purpose ? <p className="pl-7 text-xs text-sky-300/70">{page.purpose}</p> : null}
            {page.sections.length > 0 ? <p className="pl-7 text-[11px] text-sky-300/50">Sections: {page.sections.join(" · ")}</p> : null}
            {page.reuses.length > 0 ? <p className="pl-7 text-[11px] text-sky-300/50">Reuses: {page.reuses.map((file) => file.split("/").pop()).join(", ")}</p> : null}
          </li>
        ))}
      </ul>
      {t.plan && t.plan.rejected.length > 0 ? (
        <ul className={cn("grid gap-1 text-xs", toneText.warning)}>
          {t.plan.rejected.map((reason, index) => (
            <li key={index}>· Left out of the plan: {describeTransformError(reason)}</li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-sky-300/60">Anything the AI does not know, such as prices or customer quotes, is left as a visible [placeholder] for you to fill in.</p>
        <button type="button" onClick={() => void t.build()} disabled={chosen === 0} className={pill("healthy")}>
          Build {chosen} page{chosen === 1 ? "" : "s"}
        </button>
      </div>
    </div>
  );
}

const STEP_ICON = {
  pending: <CircleDashed className="h-4 w-4 text-sky-300/40" />,
  running: <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />,
  done: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
  failed: <XCircle className="h-4 w-4 text-rose-300" />,
};

export function BuildView({ t }: { t: WebsiteTransform }) {
  const steps = t.job?.steps ?? [];
  const done = steps.filter((step) => step.status === "done").length;
  const percent = steps.length ? Math.round((done / steps.length) * 100) : 0;
  return (
    <div className="grid gap-5">
      <Working title="Writing your website" detail="Each file is written by the AI and checked before it joins the draft. Nothing is saved to the project yet." />
      <div>
        <div className="mb-2 flex justify-between text-[11px] text-sky-300/70">
          <span>
            {done} of {steps.length} files
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-violet-400 transition-all duration-500" style={{ width: `${Math.max(3, percent)}%` }} />
        </div>
      </div>
      <ul className="grid gap-1.5">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm">
            {STEP_ICON[step.status]}
            <span className="text-sky-50">{step.label}</span>
            {step.file ? <span className="min-w-0 truncate font-mono text-[11px] text-sky-300/50">{step.file}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewView({ t }: { t: WebsiteTransform }) {
  const patches = t.job?.draft?.patches ?? [];
  const created = patches.filter((patch) => patch.type === "create-file").length;
  const edited = patches.length - created;
  return (
    <div className="grid gap-4">
      <p className="text-sm text-sky-100/90">
        The draft creates {created} file{created === 1 ? "" : "s"}
        {edited ? ` and edits ${edited} (the routes)` : ""}. Read it, then apply it to the project. You can undo it afterwards.
      </p>
      <TransformDraftView patches={patches} />
      <div className="flex justify-end">
        <button type="button" onClick={() => void t.apply()} disabled={t.stage === "applying"} className={pill("healthy")}>
          {t.stage === "applying" ? "Applying" : "Apply to project"}
        </button>
      </div>
    </div>
  );
}

export function DoneView({ t, onClose }: { t: WebsiteTransform; onClose: () => void }) {
  const chosen = t.pages.filter((page) => page.chosen);
  if (t.stage === "reverted") {
    return (
      <div className="grid place-items-center gap-3 py-8 text-center">
        <p className="text-lg font-semibold text-sky-50">Undone</p>
        <p className="text-sm text-sky-300/70">The project is exactly as it was before the website was added.</p>
        <button type="button" onClick={onClose} className={quiet}>
          Close
        </button>
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 text-emerald-300" />
        <p className="text-lg font-semibold text-sky-50">Your website is in the project</p>
      </div>
      <ul className="grid gap-1.5">
        {chosen.map((page) => (
          <li key={page.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-2 text-sm">
            <span className="text-sky-50">{page.title}</span>
            <span className="font-mono text-xs text-cyan-200">{page.route}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-sky-300/60">Open the pages in the preview at these addresses, and fill in the [placeholders] in the Developer workspace.</p>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => void t.undo()} disabled={t.stage === "reverting"} className={pill("warning")}>
          <Undo2 className="h-3 w-3" /> {t.stage === "reverting" ? "Undoing" : "Undo"}
        </button>
        <button type="button" onClick={onClose} className={quiet}>
          Done
        </button>
      </div>
    </div>
  );
}

export function ErrorView({ t }: { t: WebsiteTransform }) {
  const failedSteps = t.job?.steps.filter((step) => step.status === "failed" && step.error && step.error !== "not_started") ?? [];
  return (
    <div className="grid gap-4">
      <div className={cn("rounded-2xl border px-4 py-3 text-sm", tonePill.error)}>
        <p>{t.error?.text}</p>
        {[...(t.error?.reasons ?? []), ...failedSteps.map((step) => `${step.label}: ${describeTransformError(step.error as string)}`)].map((reason, index) => (
          <p key={index} className="mt-1 text-xs">
            · {reason}
          </p>
        ))}
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={t.retry} className={quiet}>
          <RotateCcw className="h-3 w-3" /> Try again
        </button>
      </div>
    </div>
  );
}

export { Working };
