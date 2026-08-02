import {
  BookOpenCheck,
  BrainCircuit,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Gauge,
  Network,
  ShieldCheck,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

const posture = [
  {
    label: "Genesis coverage",
    value: "82%",
    detail: "Canonical, constitutional, recovery and architectural sources represented",
    tone: "cyan",
    icon: BookOpenCheck,
  },
  {
    label: "Curriculum progress",
    value: "74%",
    detail: "Governed educational modules modeled and inspectable",
    tone: "violet",
    icon: BrainCircuit,
  },
  {
    label: "Competency readiness",
    value: "68%",
    detail: "Operational, governance and provenance competencies developing",
    tone: "amber",
    icon: Gauge,
  },
] as const;

const toneClasses = {
  cyan: {
    icon:
      "border-cyan-300/45 bg-cyan-300/[0.10] text-cyan-200",
    value:
      "text-cyan-200",
    glow:
      "from-cyan-300/55 via-cyan-300/20 to-transparent",
  },
  violet: {
    icon:
      "border-violet-300/45 bg-violet-300/[0.10] text-violet-200",
    value:
      "text-violet-200",
    glow:
      "from-violet-300/55 via-violet-300/20 to-transparent",
  },
  amber: {
    icon:
      "border-amber-400/45 bg-amber-400/[0.10] text-amber-300",
    value:
      "text-amber-300",
    glow:
      "from-amber-400/55 via-amber-400/20 to-transparent",
  },
} as const;

export function EducationalCommandDeck() {
  return (
    <section
      aria-label="Executive educational command deck"
      className={[
        "relative min-h-[620px] overflow-hidden rounded-[32px] border",
        "border-cyan-300/70",
        "bg-[radial-gradient(circle_at_10%_0%,rgba(37,99,235,.16),transparent_30%),radial-gradient(circle_at_62%_16%,rgba(147,51,234,.13),transparent_30%),radial-gradient(circle_at_26%_78%,rgba(180,83,9,.09),transparent_28%),linear-gradient(135deg,rgba(2,6,23,.56),rgba(15,9,39,.51),rgba(2,8,26,.55))]",
        "ring-1 ring-inset ring-cyan-200/24",
        "shadow-[0_0_0_1px_rgba(59,130,246,.18),0_0_30px_rgba(37,99,235,.16),0_28px_90px_rgba(2,6,23,.40),inset_0_1px_0_rgba(255,255,255,.08)]",
        "backdrop-blur-[54px] backdrop-saturate-[188%]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent shadow-[0_0_18px_rgba(125,211,252,.14),0_0_30px_rgba(217,119,6,.08)]" />

      <div className="relative flex h-full flex-col p-6 xl:p-7">
        <header className="flex flex-col gap-5 border-b border-cyan-300/20 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/82">
              Executive education command
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-amber-500 drop-shadow-[0_0_22px_rgba(180,83,9,.22)]">
              Chief Agent Readiness Deck
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-600/88">
              A compact executive view of educational posture, governed coverage,
              competency progression and remaining activation dependencies.
            </p>
          </div>

          <div className="rounded-[18px] border border-amber-400/38 bg-amber-400/[0.09] px-4 py-3 ring-1 ring-inset ring-amber-200/10">
            <div className="text-[10px] uppercase tracking-[0.18em] text-amber-300/72">
              Posture
            </div>
            <div className="mt-1 text-sm font-semibold text-amber-300">
              Modeled
            </div>
          </div>
        </header>

        <div className="grid gap-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="relative flex items-center justify-center rounded-[24px] border border-cyan-300/48 bg-[radial-gradient(circle_at_50%_44%,rgba(34,211,238,.10),transparent_44%),linear-gradient(135deg,rgba(4,16,42,.66),rgba(18,11,48,.62),rgba(4,17,43,.65))] p-6 ring-1 ring-inset ring-cyan-100/14">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-cyan-300/34 bg-slate-950/28 shadow-[0_0_36px_rgba(34,211,238,.13),inset_0_0_28px_rgba(37,99,235,.12)]">
              <div className="absolute inset-3 rounded-full border border-violet-300/24" />
              <div className="absolute inset-7 rounded-full border border-amber-400/20" />

              <div className="text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/72">
                  Readiness
                </div>
                <div className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-cyan-100">
                  71%
                </div>
                <div className="mt-1 text-[11px] text-sky-400/72">
                  educational posture
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {posture.map((item) => {
              const Icon = item.icon;
              const tone = toneClasses[item.tone];

              return (
                <article
                  key={item.label}
                  className={[
                    "group relative overflow-hidden rounded-[20px] border p-4",
                    "border-cyan-300/42",
                    "bg-[linear-gradient(135deg,rgba(3,12,35,.65),rgba(17,10,45,.61),rgba(3,14,37,.64))]",
                    "ring-1 ring-inset ring-cyan-100/10",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,.05)]",
                    "transition-[transform,border-color,box-shadow] duration-200",
                    "hover:-translate-y-1 hover:border-cyan-100/82",
                    "hover:shadow-[0_0_28px_rgba(34,211,238,.14),0_18px_40px_rgba(2,6,23,.34)]",
                    "motion-reduce:transition-none",
                  ].join(" ")}
                >
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r ${tone.glow}`}
                  />

                  <div className="relative flex items-start gap-4">
                    <div className="shrink-0">
                      <ExecutivePremiumIcon
                        icon={Icon}
                        state={
                          item.tone === "amber"
                            ? "warning"
                            : "active"
                        }
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-semibold text-sky-200">
                          {item.label}
                        </h3>

                        <div className={`text-xl font-semibold ${tone.value}`}>
                          {item.value}
                        </div>
                      </div>

                      <p className="mt-1.5 text-xs leading-5 text-sky-500/78">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 border-t border-cyan-300/18 pt-6 sm:grid-cols-2">
          <article className="rounded-[20px] border border-violet-300/38 bg-violet-300/[0.07] p-4 ring-1 ring-inset ring-violet-200/10">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <ExecutivePremiumIcon
                  icon={ShieldCheck}
                  state="healthy"
                />
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.19em] text-violet-300/84">
                  Governing boundary
                </div>
                <div className="mt-1 text-sm font-medium text-violet-200">
                  Human authorization retained
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[20px] border border-amber-400/38 bg-amber-400/[0.07] p-4 ring-1 ring-inset ring-amber-200/10">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <ExecutivePremiumIcon
                  icon={Network}
                  state="warning"
                />
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.19em] text-amber-400/88">
                  Next dependency
                </div>
                <div className="mt-1 text-sm font-medium text-amber-300">
                  Business and domain ownership
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-auto pt-6">
          <button
            type="button"
            className={[
              "group flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left",
              "border-cyan-300/42",
              "bg-[linear-gradient(135deg,rgba(2,12,34,.72),rgba(17,10,44,.68),rgba(2,14,36,.71))]",
              "ring-1 ring-inset ring-cyan-100/10",
              "transition-[transform,border-color,box-shadow] duration-200",
              "hover:-translate-y-0.5 hover:border-cyan-100/82",
              "hover:shadow-[0_0_26px_rgba(34,211,238,.14)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80",
              "motion-reduce:transition-none",
            ].join(" ")}
          >
            <span>
              <span className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.19em] text-cyan-300/82">
                <ExecutivePremiumIcon
                  icon={CircleAlert}
                  state="warning"
                />
                Activation constraint
              </span>

              <span className="mt-1 block text-sm font-medium text-sky-200">
                Complete governed dependencies before authorization review
              </span>
            </span>

            <ChevronRight className="h-4 w-4 text-cyan-300/72 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </button>

          <div className="mt-3 flex items-center gap-3 text-[11px] text-emerald-300/72">
            <ExecutivePremiumIcon
              icon={CircleCheckBig}
              state="healthy"
            />
            Runtime truth remains explicitly outside this fixture model.
          </div>
        </div>
      </div>
    </section>
  );
}
