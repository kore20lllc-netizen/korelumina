import { Activity, Cpu, MemoryStick, ServerCog } from "lucide-react";

import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { cn } from "@/lib/utils";

import { ExecutiveMetricCard } from "../../knowledge-v3/layout/ExecutiveMetricCard";
import type { ExecutiveRibbonMetric } from "../../knowledge-v3/layout/ExecutiveRibbonProvider";
import { DesignPreviewBadge, toneDot, tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { HEALTH_LABEL, HEALTH_TONE, STATE_LABEL, STATE_TONE } from "../shared/runtimePresentation";
import type { RuntimeOpsView } from "../state/useRuntimeOpsView";

/*
 * MS-2026-0011: the Runtime Operations command deck, in the Executive
 * Office deck's materials: Runtime's overall health on the left, measured
 * metrics and every project's status on the right.
 */

function metricsFor(view: RuntimeOpsView): ExecutiveRibbonMetric[] {
  const overall = view.snapshot?.overall;
  return [
    {
      id: "running",
      label: "Running Projects",
      value: overall ? `${overall.running} of ${overall.total}` : "—",
      detail: overall ? (overall.total === 0 ? "No projects yet" : `${overall.total - overall.running} not running`) : "Reading Runtime",
      icon: Activity,
      accent: "text-emerald-300",
      surface: "bg-emerald-400/15",
    },
    {
      id: "cpu",
      label: "Average CPU",
      value: overall && overall.running > 0 ? `${overall.avgCpu}%` : "—",
      detail: "Across running projects, sampled from their processes",
      icon: Cpu,
      accent: "text-cyan-300",
      surface: "bg-cyan-400/15",
    },
    {
      id: "memory",
      label: "Average Memory",
      value: overall && overall.running > 0 ? `${overall.avgMem}%` : "—",
      detail: "Resident memory of running projects, of this machine's memory",
      icon: MemoryStick,
      accent: "text-violet-300",
      surface: "bg-violet-400/15",
    },
  ];
}

export function RuntimeOpsCommandDeck({ view }: { view: RuntimeOpsView }) {
  const overall = view.snapshot?.overall;
  const tone = overall ? HEALTH_TONE[overall.health.status] : "active";
  const all = view.snapshot?.projects ?? [];
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
            <ExecutivePremiumIcon icon={ServerCog} state={tone} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/80 backdrop-blur-xl">
                  Universal Runtime
                </span>
                <DesignPreviewBadge wiring="live" />
              </div>
              <h1 className="mt-3 text-5xl font-black tracking-[-0.045em]">
                <span className="text-gradient-lumina">Runtime</span>{" "}
                <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">Operations</span>
              </h1>
            </div>
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-cyan">Is everything running?</h2>
          <div className="mt-6 grid gap-3 rounded-[20px] border border-white/[0.08] bg-slate-950/40 p-4">
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon icon={Activity} state={tone} />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Runtime health</div>
                <div className={`text-base font-semibold ${toneText[tone]}`}>{overall ? HEALTH_LABEL[overall.health.status] : view.status === "error" ? "Unreachable" : "Reading…"}</div>
              </div>
            </div>
            <p className="text-xs leading-5 text-sky-300/70">
              {view.status === "error"
                ? view.error?.message ?? "Runtime could not be reached. Start it with npm run dev."
                : overall?.health.reasons.join(" ") ?? "Reading Runtime…"}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-sky-300/55">
              Shortcuts · <span className="text-amber-200">/</span> search · <span className="text-amber-200">R</span> restart · <span className="text-amber-200">S</span> stop · <span className="text-amber-200">Enter</span> open project
            </p>
            {view.status === "error" ? (
              <button type="button" onClick={view.reload} className={`justify-self-start rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill.active}`}>
                Try again
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {metricsFor(view).map((metric) => (
              <ExecutiveMetricCard key={metric.id} metric={metric} />
            ))}
          </div>
          <div className="rounded-[20px] border border-white/[0.08] bg-slate-950/40 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">Every project</div>
            {all.length === 0 ? (
              <p className="mt-3 text-xs text-sky-300/60">{view.status === "ready" ? "No projects yet. Import one in Imports." : "Reading Runtime…"}</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {all.map((project) => (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => view.select(project.id)}
                      aria-pressed={view.selected?.id === project.id}
                      className={cn(
                        "flex w-full min-w-0 items-center gap-2 rounded-[12px] border bg-slate-950/40 px-3 py-2 text-left",
                        view.selected?.id === project.id ? "border-cyan-300/50" : "border-white/[0.06] hover:border-white/20",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[STATE_TONE[project.state]], project.state === "starting" || project.state === "restarting" ? "animate-pulse" : "")} />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-white/85">{project.name}</span>
                      <span className={`shrink-0 text-[10px] ${toneText[STATE_TONE[project.state]]}`}>{STATE_LABEL[project.state]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
