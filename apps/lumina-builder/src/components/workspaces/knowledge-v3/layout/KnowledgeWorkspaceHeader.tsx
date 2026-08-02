import {
  BookOpenCheck,
  Factory,
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

      <div
        className={[
          "shrink-0 rounded-2xl border px-5 py-4",
          content.statusClass,
        ].join(" ")}
      >
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
          {content.statusLabel}
        </div>

        <div className="mt-1 text-sm font-semibold">
          {content.statusValue}
        </div>
      </div>
    </div>
  );
}
