import { Activity, ClipboardList, Flag, ShieldCheck, Wrench } from "lucide-react";

import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { cn } from "@/lib/utils";

import { ExecutiveMetricCard } from "../../knowledge-v3/layout/ExecutiveMetricCard";
import type { ExecutiveRibbonMetric } from "../../knowledge-v3/layout/ExecutiveRibbonProvider";
import { DesignPreviewBadge, tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import type { PreviewTone } from "../../executive/design/executiveDesignPreview";
import type { InHouseConsole } from "../state/useInHouseConsole";

/*
 * MS-2026-0011: the In-House Dev command deck, in the Executive Office
 * deck's materials: what needs attention on the left, the three live
 * measures on the right.
 */

function metricsFor(view: InHouseConsole): ExecutiveRibbonMetric[] {
  const overall = view.runtime.snapshot?.overall;
  const total = view.projects.length;
  const unassigned = view.openRepairs.filter((engagement) => !engagement.assignee).length;
  return [
    {
      id: "repairs",
      label: "Open Repairs",
      value: view.engagements.status === "ok" ? String(view.openRepairs.length) : "—",
      detail: view.engagements.status === "error" ? "Queue unreadable" : view.engagements.status === "ok" ? (unassigned ? `${unassigned} without an engineer` : "Every one has an engineer") : "Reading the queue",
      icon: ClipboardList,
      accent: "text-amber-300",
      surface: "bg-amber-400/15",
    },
    {
      id: "running",
      label: "Running Projects",
      value: overall ? `${overall.running} of ${overall.total}` : "—",
      detail: view.runtime.status === "error" ? "Runtime unreachable" : overall ? "Processes Runtime is running now" : "Reading Runtime",
      icon: Activity,
      accent: "text-emerald-300",
      surface: "bg-emerald-400/15",
    },
    {
      id: "audited",
      label: "Audited Projects",
      value: total ? `${view.audited} of ${total}` : "—",
      detail: view.lowest
        ? `Lowest grade ${view.lowest.report.summary.grade} (${view.lowest.report.summary.score}) · ${view.lowest.project.name}`
        : total ? "No scored audit yet" : "No projects yet",
      icon: ShieldCheck,
      accent: "text-cyan-300",
      surface: "bg-cyan-400/15",
    },
    {
      id: "missions",
      label: "Open Missions",
      value: view.missions.status === "ok" ? String(view.openMissions.length) : "—",
      detail: view.missions.status === "error"
        ? "Missions unreadable"
        : view.missions.status === "ok"
          ? view.awaiting.length ? `${view.awaiting.length} awaiting your approval` : "None awaiting you"
          : "Reading missions",
      icon: Flag,
      accent: "text-violet-300",
      surface: "bg-violet-400/15",
    },
  ];
}

export function InHouseCommandDeck({ view }: { view: InHouseConsole }) {
  const errors = view.attention.filter((item) => item.tone === "error").length;
  const tone: PreviewTone = view.runtime.status === "error" ? "error" : errors ? "error" : view.attention.length ? "warning" : "healthy";
  const headline = view.runtime.status === "error"
    ? "Runtime is unreachable"
    : view.attention.length === 0
      ? "Nothing needs attention"
      : `${view.attention.length} thing${view.attention.length === 1 ? "" : "s"} need${view.attention.length === 1 ? "s" : ""} attention`;

  return (
    <header
      className={cn(
        "group relative min-w-0 overflow-hidden",
        "rounded-[30px]",
        "border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20",
        "bg-slate-950/[0.48] backdrop-blur-[44px] backdrop-saturate-[170%]",
        "shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_30px_rgba(37,99,235,.16),0_28px_160px_rgba(0,0,0,.40),inset_0_0_22px_rgba(56,189,248,.05)]",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_8%,rgba(217,119,6,.20),transparent_30%),radial-gradient(circle_at_30%_70%,rgba(124,58,237,.22),transparent_34%),radial-gradient(circle_at_78%_30%,rgba(67,56,202,.16),transparent_32%),radial-gradient(circle_at_95%_90%,rgba(34,211,238,.06),transparent_24%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[7%] top-0 h-px opacity-90 [background:linear-gradient(90deg,transparent_0%,rgba(96,165,250,.10)_12%,rgba(247,215,116,.42)_34%,rgba(255,255,255,.62)_50%,rgba(125,211,252,.28)_69%,rgba(59,130,246,.08)_88%,transparent_100%)]"
      />

      <div className="relative z-10 grid gap-8 px-8 py-8 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start gap-5">
            <ExecutivePremiumIcon icon={Wrench} state={tone} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/80 backdrop-blur-xl">
                  Super Admin · Internal
                </span>
                <DesignPreviewBadge wiring="live" />
              </div>
              <h1 className="mt-3 text-5xl font-black tracking-[-0.045em]">
                <span className="text-gradient-lumina">In-House</span>{" "}
                <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">Dev Console</span>
              </h1>
            </div>
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-cyan">What needs the team's attention?</h2>
          <div className="mt-6 grid gap-3 rounded-[20px] border border-white/[0.08] bg-slate-950/40 p-4">
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon icon={Activity} state={tone} />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Internal tooling</div>
                <div className={`text-base font-semibold ${toneText[tone]}`}>{headline}</div>
              </div>
            </div>
            <p className="text-xs leading-5 text-sky-300/70">
              {view.runtime.status === "error"
                ? view.runtime.error?.message ?? "Start Runtime with npm run dev."
                : "Read from the repair queue, Runtime's projects, each project's latest Repo Audit, and the Executive Office missions."}
            </p>
            <button type="button" onClick={view.reload} className={`justify-self-start rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill.active}`}>
              Read again
            </button>
          </div>
        </div>

        <div className="grid min-w-0 content-start gap-4 sm:grid-cols-2">
          {metricsFor(view).map((metric) => (
            <ExecutiveMetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>
    </header>
  );
}
