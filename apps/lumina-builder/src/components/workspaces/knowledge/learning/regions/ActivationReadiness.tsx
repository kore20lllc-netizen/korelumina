import {
  CheckCircle2,
  CircleOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  cn,
} from "@/lib/utils";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  LuminaFlagshipSurface,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipSurface";

import {
  LearningStatusBadge,
  flagshipAppearance,
} from "../presentation";

interface ActivationReadinessItem {
  label: string;
  state:
    | "complete"
    | "partial"
    | "blocked";
  detail: string;
}

const READINESS_ITEMS: ActivationReadinessItem[] = [
  {
    label: "Genesis completion",
    state: "partial",
    detail:
      "Constitutional, architectural, recovery and conversation sources are represented; business and domain coverage remains incomplete.",
  },
  {
    label: "Corpus approval",
    state: "partial",
    detail:
      "Architectural conversations are admitted; governance and mission conversation approval remains incomplete.",
  },
  {
    label: "Dependency completion",
    state: "blocked",
    detail:
      "Business and domain ownership and source admission remain unresolved.",
  },
  {
    label: "Competency posture",
    state: "partial",
    detail:
      "Explainable grounding and mission-boundary review remain incomplete.",
  },
  {
    label: "Critical architectural conversations reviewed",
    state: "complete",
    detail:
      "Validated reconstruction conversations are represented in the educational corpus.",
  },
  {
    label: "Constitutional conversations covered",
    state: "partial",
    detail:
      "Constitutional drafting conversations are visible but still require final educational review.",
  },
  {
    label: "Mission conversations covered",
    state: "partial",
    detail:
      "Mission records are represented; mission conversation curriculum remains incomplete.",
  },
  {
    label: "Governance conversations covered",
    state: "partial",
    detail:
      "Governance conversation provenance is visible; approval is not complete.",
  },
  {
    label: "Human authorization",
    state: "blocked",
    detail:
      "Activation authority is constitutionally human-governed and intentionally unavailable in Phase 1A.",
  },
  {
    label: "Rollback and oversight boundary",
    state: "complete",
    detail:
      "Human authority, Runtime truth, recovery and oversight obligations remain explicit.",
  },
];

function toneForState(
  state: ActivationReadinessItem["state"],
) {
  if (state === "complete") {
    return "complete" as const;
  }

  if (state === "partial") {
    return "partial" as const;
  }

  return "blocked" as const;
}

function premiumIconState(
  state: ActivationReadinessItem["state"],
) {
  if (state === "complete") {
    return "healthy" as const;
  }

  if (state === "partial") {
    return "warning" as const;
  }

  return "error" as const;
}

export function ActivationReadiness() {
  const completed =
    READINESS_ITEMS.filter(
      (item) =>
        item.state === "complete",
    ).length;

  const blocked =
    READINESS_ITEMS.filter(
      (item) =>
        item.state === "blocked",
    ).length;

  return (
    <LuminaFlagshipPanel
      title="Activation Readiness"
      description="Informational readiness only — no activation, certification or authority control is available."
      toolbar={
        <LearningStatusBadge tone="blocked">
          Not ready
        </LearningStatusBadge>
      }
      emphasis="strong"
    >
      <div className="grid gap-3 border-b border-cyan-300/14 p-4 sm:grid-cols-3">
        <LuminaFlagshipSurface
          className="
            p-4
            shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
          "
        >
          <div className={flagshipAppearance.eyebrow}>
            Readiness posture
          </div>

          <div className="mt-2 text-2xl font-semibold text-amber-400">
            Partial
          </div>
        </LuminaFlagshipSurface>

        <LuminaFlagshipSurface
          className="
            p-4
            shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
          "
        >
          <div className={flagshipAppearance.eyebrow}>
            Completed gates
          </div>

          <div className="mt-2 text-2xl font-semibold text-emerald-300">
            {completed}
          </div>
        </LuminaFlagshipSurface>

        <LuminaFlagshipSurface
          className="
            p-4
            shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
          "
        >
          <div className={flagshipAppearance.eyebrow}>
            Blocking gates
          </div>

          <div className="mt-2 text-2xl font-semibold text-rose-300">
            {blocked}
          </div>
        </LuminaFlagshipSurface>
      </div>

      <div className="grid gap-3 p-4 xl:grid-cols-2">
        {READINESS_ITEMS.map((item) => {
          const Icon =
            item.state === "complete"
              ? CheckCircle2
              : item.state === "partial"
                ? TriangleAlert
                : CircleOff;

          return (
            <LuminaFlagshipCard
              key={item.label}
              className="group flex items-start gap-3 p-4"
            >

              <div
                aria-hidden="true"
                className="
                  pointer-events-none absolute inset-0 rounded-[20px]
                  bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.08),transparent_36%)]
                  opacity-0 transition-opacity duration-200
                  group-hover:opacity-100
                  motion-reduce:transition-none
                "
              />

              <div className="shrink-0">
                <ExecutivePremiumIcon
                  icon={Icon}
                  state={premiumIconState(
                    item.state,
                  )}
                />
              </div>

              <div className="relative min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-sky-200">
                    {item.label}
                  </h3>

                  <LearningStatusBadge
                    tone={toneForState(
                      item.state,
                    )}
                  >
                    {item.state}
                  </LearningStatusBadge>
                </div>

                <p className="mt-2 text-xs leading-5 text-sky-500/76">
                  {item.detail}
                </p>
              </div>
            </LuminaFlagshipCard>
          );
        })}
      </div>

      <div className="grid gap-3 border-t border-cyan-300/14 p-4 sm:grid-cols-2">
        <LuminaFlagshipSurface
          className="
            p-4
            shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
          "
        >
          <div className="flex items-center gap-3 text-xs font-semibold text-amber-400">
            <ExecutivePremiumIcon
              icon={ShieldCheck}
              state="active"
            />
            Oversight boundary
          </div>

          <p className="mt-2 text-xs leading-5 text-sky-500/76">
            Human governance remains authoritative. Educational state must never be interpreted as Runtime truth.
          </p>
        </LuminaFlagshipSurface>

        <LuminaFlagshipSurface
          className="
            p-4
            shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
          "
        >
          <div className="flex items-center gap-3 text-xs font-semibold text-amber-400">
            <ExecutivePremiumIcon
              icon={KeyRound}
              state="warning"
            />
            Activation authority
          </div>

          <p className="mt-2 text-xs leading-5 text-sky-500/76">
            Authorization registry, certification and activation controls are explicitly outside this milestone.
          </p>
        </LuminaFlagshipSurface>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          disabled
          className={[
            "flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border",
            "border-cyan-300/24",
            "bg-[linear-gradient(135deg,rgba(8,20,48,0.58),rgba(23,14,49,0.48))]",
            "text-sm font-medium text-sky-500/46",
            "shadow-[inset_0_1px_0_rgba(186,230,253,0.05),inset_0_0_18px_rgba(2,6,23,0.42)]",
            "cursor-not-allowed",
          ].join(" ")}
          title="Activation is intentionally unavailable during the UI-contract milestone."
        >
          <LockKeyhole className="h-3.5 w-3.5" />
          Activation unavailable
        </button>
      </div>
    </LuminaFlagshipPanel>
  );
}
