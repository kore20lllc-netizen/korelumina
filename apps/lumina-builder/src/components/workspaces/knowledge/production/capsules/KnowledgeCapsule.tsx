import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  PackageCheck,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  flagshipAppearance,
} from "../../learning/presentation/flagshipAppearance";

import type {
  KnowledgeCapsule as KnowledgeCapsuleModel,
  KnowledgeCapsuleState,
} from "./types";

interface KnowledgeCapsuleProps {
  capsule: KnowledgeCapsuleModel;
  selected?: boolean;
  compact?: boolean;
  onSelect?: (capsuleId: string) => void;
}

const statePresentation: Record<
  KnowledgeCapsuleState,
  {
    label: string;
    shell: string;
    core: string;
    iconState:
      | "healthy"
      | "active"
      | "warning"
      | "error";
  }
> = {
  queued: {
    label: "Queued",
    shell: "border-slate-300/32 from-slate-500/18 to-slate-950/28",
    core: "bg-slate-300/10 text-slate-200",
    iconState: "active",
  },
  processing: {
    label: "Processing",
    shell: "border-cyan-300/48 from-cyan-400/18 to-blue-950/30",
    core: "bg-cyan-300/12 text-cyan-100",
    iconState: "active",
  },
  waiting: {
    label: "Waiting",
    shell: "border-sky-300/38 from-sky-400/14 to-slate-950/28",
    core: "bg-sky-300/10 text-sky-200",
    iconState: "active",
  },
  blocked: {
    label: "Blocked",
    shell: "border-amber-300/48 from-amber-400/18 to-orange-950/28",
    core: "bg-amber-300/12 text-amber-200",
    iconState: "warning",
  },
  failed: {
    label: "Failed",
    shell: "border-rose-300/52 from-rose-400/18 to-rose-950/32",
    core: "bg-rose-300/12 text-rose-200",
    iconState: "error",
  },
  "needs-review": {
    label: "Needs Review",
    shell: "border-amber-300/52 from-amber-400/18 to-violet-950/30",
    core: "bg-amber-300/12 text-amber-200",
    iconState: "warning",
  },
  validated: {
    label: "Validated",
    shell: "border-emerald-300/48 from-emerald-400/18 to-cyan-950/28",
    core: "bg-emerald-300/12 text-emerald-200",
    iconState: "healthy",
  },
  approved: {
    label: "Approved",
    shell: "border-emerald-300/58 from-emerald-400/22 to-blue-950/28",
    core: "bg-emerald-300/14 text-emerald-100",
    iconState: "healthy",
  },
  published: {
    label: "Published",
    shell: "border-violet-300/52 from-violet-400/20 to-indigo-950/30",
    core: "bg-violet-300/12 text-violet-100",
    iconState: "healthy",
  },
  adapted: {
    label: "Adapted",
    shell: "border-fuchsia-300/44 from-fuchsia-400/18 to-violet-950/30",
    core: "bg-fuchsia-300/10 text-fuchsia-100",
    iconState: "active",
  },
  consumed: {
    label: "Consumed",
    shell: "border-blue-300/40 from-blue-400/16 to-slate-950/28",
    core: "bg-blue-300/10 text-blue-100",
    iconState: "active",
  },
  superseded: {
    label: "Superseded",
    shell: "border-slate-300/30 from-slate-400/12 to-slate-950/32",
    core: "bg-slate-300/8 text-slate-300",
    iconState: "warning",
  },
  archived: {
    label: "Archived",
    shell: "border-slate-400/24 from-slate-500/8 to-slate-950/36",
    core: "bg-slate-400/8 text-slate-400",
    iconState: "active",
  },
};

export function KnowledgeCapsule({
  capsule,
  selected = false,
  compact = false,
  onSelect,
}: KnowledgeCapsuleProps) {
  const presentation =
    statePresentation[capsule.state];

  const peeled =
    capsule.integrity === "peeling";

  const resealing =
    capsule.integrity === "resealing";

  const Icon =
    peeled
      ? AlertTriangle
      : capsule.state === "validated" ||
          capsule.state === "approved" ||
          capsule.state === "published"
        ? CheckCircle2
        : capsule.state === "blocked" ||
            capsule.state === "needs-review"
          ? LockKeyhole
          : capsule.state === "queued" ||
              capsule.state === "waiting"
            ? Clock3
            : PackageCheck;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${capsule.identity}, ${presentation.label}`}
      onClick={() => onSelect?.(capsule.id)}
      className={[
        flagshipAppearance.capsuleButton,
        compact ? "max-w-[280px]" : "max-w-[360px]",
      ].join(" ")}
    >
      <div
        className={[
          flagshipAppearance.capsuleShell,
          presentation.shell,
          selected
            ? flagshipAppearance.capsuleShellSelected
            : flagshipAppearance.capsuleShellIdle,
          peeled ? "px-5 py-4" : "px-4 py-3",
        ].join(" ")}
      >
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2",
            peeled
              ? "bg-gradient-to-b from-rose-200/80 via-amber-200/70 to-rose-200/80"
              : "bg-white/12",
          ].join(" ")}
        />

        {peeled ? (
          <>
            <div
              aria-hidden="true"
              className={[
                flagshipAppearance.capsulePeelHalf,
                flagshipAppearance.capsulePeelHalfTone.left,
              ].join(" ")}
            />
            <div
              aria-hidden="true"
              className={[
                flagshipAppearance.capsulePeelHalf,
                flagshipAppearance.capsulePeelHalfTone.right,
              ].join(" ")}
            />
          </>
        ) : null}

        <div className="relative z-10 flex items-center gap-4">
          <ExecutivePremiumIcon
            icon={Icon}
            state={presentation.iconState}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-cyan-100/88">
                {capsule.identity}
              </span>

              <span
                className={[
                  "rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]",
                  presentation.core,
                ].join(" ")}
              >
                {presentation.label}
              </span>

              {resealing ? (
                <span
                  className={
                    flagshipAppearance.capsuleResealingBadge
                  }
                >
                  Resealing
                </span>
              ) : null}
            </div>

            <div className="mt-2 text-sm font-semibold text-amber-400">
              {capsule.title}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-sky-300/72">
              <span>{capsule.stage}</span>
              <span aria-hidden="true">→</span>
              <span>{capsule.destination}</span>
              <span>{capsule.confidence}% trust</span>
            </div>
          </div>
        </div>

        {peeled ? (
          <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-2">
            {capsule.layers.map((layer) => (
              <div
                key={layer.id}
                className={[
                  flagshipAppearance.capsuleLayer,
                  layer.status === "failed"
                    ? flagshipAppearance.capsuleLayerTone.failed
                    : layer.status === "warning"
                      ? flagshipAppearance.capsuleLayerTone.warning
                      : flagshipAppearance.capsuleLayerTone.healthy,
                ].join(" ")}
              >
                <div
                  className={[
                    "text-[9px] font-semibold uppercase tracking-[0.12em]",
                    layer.status === "failed"
                      ? flagshipAppearance.capsuleLayerLabelTone.failed
                      : layer.status === "warning"
                        ? flagshipAppearance.capsuleLayerLabelTone.warning
                        : flagshipAppearance.capsuleLayerLabelTone.healthy,
                  ].join(" ")}
                >
                  {layer.label}
                </div>
                <div className="mt-1 text-[10px] leading-4 text-sky-200/78">
                  {layer.detail}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}
