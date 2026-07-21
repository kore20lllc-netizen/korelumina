import {
  Activity,
  BookOpenCheck,
  CircleCheck,
  Radio,
  ShieldCheck,
} from "lucide-react";

import {
  accent,
  border,
  glass,
  gradients,
  iconSurface,
  radius,
  shadow,
} from "../theme/appearance";

interface RibbonMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  accent: string;
  surface: string;
}

const RIBBON_METRICS: RibbonMetric[] = [
  {
    id: "health",
    label: "Knowledge Health",
    value: "Operational",
    detail: "Production shell initialized",
    icon: CircleCheck,
    accent: accent.emerald,
    surface: iconSurface.emerald,
  },
  {
    id: "coverage",
    label: "Evidence Coverage",
    value: "—",
    detail: "Awaiting runtime pipeline",
    icon: ShieldCheck,
    accent: accent.violet,
    surface: iconSurface.violet,
  },
  {
    id: "canonical",
    label: "Canonical Knowledge",
    value: "—",
    detail: "Publication unavailable",
    icon: BookOpenCheck,
    accent: accent.amber,
    surface: iconSurface.amber,
  },
];

export function ExecutiveRibbon() {
  return (
    <header
      className={[
        "group",
        "relative",
        "overflow-hidden",
        radius.panel,
        border.hero,
        glass.hero,
        shadow.floating,
        "ring-1",
        "ring-inset",
        "ring-white/10",
      ].join(" ")}
    >
      <div
        className={[
          "absolute",
          "inset-0",
          gradients.executive,
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-[8%]
          top-0
          h-px
          [background:linear-gradient(90deg,transparent,rgba(247,215,116,.95),rgba(255,255,255,.92),rgba(90,200,255,.90),transparent)]
          [box-shadow:0_0_44px_rgba(90,200,255,.45),0_0_68px_rgba(247,215,116,.22)]
        "
      />

      <div
        className="
          relative
          z-10
          flex
          min-h-[172px]
          flex-col
          justify-between
          gap-8
          px-8
          py-8
          lg:flex-row
          lg:items-center
        "
      >
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-cyan-300/20
                bg-cyan-400/10
                px-3.5
                py-1.5
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-cyan-100
                backdrop-blur-xl
              "
            >
              <Radio className="h-3.5 w-3.5" />
              Knowledge Operations
            </span>

            <span
              className="
                rounded-full
                border
                border-emerald-300/20
                bg-emerald-400/10
                px-3.5
                py-1.5
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-emerald-100
                backdrop-blur-xl
              "
            >
              V3
            </span>
          </div>          <h1
            className="
              bg-gradient-to-r
              from-[#F7D774]
              via-white
              to-[#67D4FF]
              bg-clip-text
              text-4xl
              font-black
              tracking-tight
              text-transparent
              sm:text-5xl
            "
          >
            Knowledge Operations
          </h1>

          <p
            className="
              mt-5
              max-w-3xl
              text-[15px]
              leading-8
              text-white/70
            "
          >
            Production environment for institutional knowledge
            acquisition, evidence validation, publication,
            organizational memory, governance, and enterprise
            intelligence.
          </p>
        </div>

        <div
          className="
            relative
            z-10
            grid
            w-full
            gap-4
            sm:grid-cols-3
            lg:max-w-[720px]
          "
        >
          {RIBBON_METRICS.map((metric) => {
            const Icon = metric.icon;

            return (
              <section
                key={metric.id}
                className={[
                  "relative",
                  "overflow-hidden",
                  radius.card,
                  glass.card,
                  border.subtle,
                  shadow.soft,
                  "px-5",
                  "py-4",
                  "transition-all",
                  "duration-300",
                  "hover:-translate-y-1",
                  "hover:border-white/16",
                ].join(" ")}
              >
                <div
                  aria-hidden="true"
                  className="
                    absolute
                    inset-0
                    opacity-0
                    transition-opacity
                    duration-300
                    group-hover:opacity-100
                    [background:radial-gradient(circle_at_top_right,rgba(255,255,255,.08),transparent_55%)]
                  "
                />

                <div className="relative flex items-start justify-between">
                  <div className="min-w-0">
                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.18em]
                        text-white/52
                      "
                    >
                      {metric.label}
                    </p>

                    <p
                      className="
                        mt-2
                        text-2xl
                        font-bold
                        tracking-tight
                        text-white
                      "
                    >
                      {metric.value}
                    </p>
                  </div>

                  <span
                    className={[
                      "flex",
                      "h-11",
                      "w-11",
                      "items-center",
                      "justify-center",
                      "rounded-2xl",
                      "border",
                      metric.surface,
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-5",
                        "w-5",
                        metric.accent,
                      ].join(" ")}
                    />
                  </span>
                </div>

                <p
                  className="
                    relative
                    mt-4
                    text-[11px]
                    leading-5
                    text-white/46
                  "
                >
                  {metric.detail}
                </p>
              </section>
            );
          })}
        </div>      </div>
    </header>
  );
}
