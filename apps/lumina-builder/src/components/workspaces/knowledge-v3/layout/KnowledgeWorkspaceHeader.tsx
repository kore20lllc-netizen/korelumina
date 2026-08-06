import {
  BookOpenCheck,
  Factory,
  GraduationCap,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  useKnowledgeV3Workspace,
} from "../state";

const DOMAIN_CONTENT = {
  learning: {
    eyebrow: "Educational Command",
    title:
      "Chief Agent Educational Readiness",
    description:
      "Inspect Genesis sources, governed curriculum, competency posture, dependencies and activation readiness.",
    statusLabel:
      "Educational posture",
    statusValue:
      "Modeled",
    statusClass:
      "border-amber-400/20 bg-amber-400/10 text-amber-200",
    icon: BookOpenCheck,
    iconState: "warning",
  },
  production: {
    eyebrow: "Production Pipeline",
    title:
      "Institutional Knowledge Production",
    description:
      "Acquire, validate, compile, and operationalize institutional knowledge.",
    statusLabel: "Runtime",
    statusValue: "Operational",
    statusClass:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    icon: Factory,
    iconState: "healthy",
  },
} as const;

export function KnowledgeWorkspaceHeader() {
  const {
    activeDomain,
    setActiveDomain,
  } = useKnowledgeV3Workspace();

  const content =
    DOMAIN_CONTENT[activeDomain];

  const Icon = content.icon;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-cyan">
          <ExecutivePremiumIcon
            icon={Icon}
            state={content.iconState}
          />
          {content.eyebrow}
        </div>

        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-cyan">
          {content.title}
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
          {content.description}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-3">
        <div
          role="group"
          aria-label="Knowledge workspace"
          className={[
            "inline-flex items-center gap-1 rounded-xl border p-1",
            "border-cyan-300/45 bg-slate-950/75",
            "shadow-[0_0_0_1px_rgba(37,99,235,0.14)]",
            "backdrop-blur-xl",
          ].join(" ")}
        >
          <button
            type="button"
            aria-pressed={activeDomain === "learning"}
            onClick={() => setActiveDomain("learning")}
            className={[
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5",
              "text-[10px] font-semibold uppercase tracking-[0.12em]",
              "transition-[border-color,background-color,color,box-shadow] duration-200",
              activeDomain === "learning"
                ? "border-amber-300/55 bg-amber-500/14 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.12)]"
                : "border-transparent bg-transparent text-white/45 hover:text-white/75",
            ].join(" ")}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Learning
          </button>

          <button
            type="button"
            aria-pressed={activeDomain === "production"}
            onClick={() => setActiveDomain("production")}
            className={[
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5",
              "text-[10px] font-semibold uppercase tracking-[0.12em]",
              "transition-[border-color,background-color,color,box-shadow] duration-200",
              activeDomain === "production"
                ? "border-amber-300/75 bg-cyan-400/12 text-cyan shadow-[0_0_14px_rgba(34,211,238,0.14)]"
                : "border-transparent bg-transparent text-white/45 hover:text-white/75",
            ].join(" ")}
          >
            <Factory className="h-3.5 w-3.5" />
            Production
          </button>
        </div>

        <div
          className={[
            "rounded-xl border px-4 py-3",
            content.statusClass,
          ].join(" ")}
        >
          <div className="text-[9px] uppercase tracking-[0.18em] text-white/45">
            {content.statusLabel}
          </div>

          <div className="mt-1 text-xs font-semibold">
            {content.statusValue}
          </div>
        </div>
      </div>
    </div>
  );
}
