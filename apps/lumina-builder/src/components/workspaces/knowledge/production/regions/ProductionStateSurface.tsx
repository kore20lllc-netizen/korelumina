import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleX,
  CloudOff,
  LoaderCircle,
  PackageOpen,
  RefreshCw,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  FlagshipPanel,
} from "../../learning/presentation/FlagshipPanel";

import type {
  ProductionSurfaceState,
} from "../state";

interface ProductionStateSurfaceProps {
  state: ProductionSurfaceState;
}

const stateContent = {
  empty: {
    label: "Empty",
    title: "No governed production artifacts",
    description:
      "The region remains structurally stable while no evidence or package candidates are selected.",
    icon: PackageOpen,
    iconState: "active",
  },
  loading: {
    label: "Loading",
    title: "Preparing production workspace",
    description:
      "Fixture-backed production regions are being prepared without implying live service activity.",
    icon: LoaderCircle,
    iconState: "active",
  },
  processing: {
    label: "Processing",
    title: "Production posture in progress",
    description:
      "Evidence, compiler, IR and validation stages are represented as an inspectable visual flow.",
    icon: CircleDashed,
    iconState: "active",
  },
  success: {
    label: "Success",
    title: "Package candidate ready",
    description:
      "The selected evidence path has completed its visual journey to governed package readiness.",
    icon: CheckCircle2,
    iconState: "healthy",
  },
  partial: {
    label: "Partial",
    title: "Production evidence incomplete",
    description:
      "The current package candidate is usable for inspection but still lacks complete source coverage.",
    icon: AlertTriangle,
    iconState: "warning",
  },
  warning: {
    label: "Warning",
    title: "Manual review required",
    description:
      "Authority, provenance, supersession or educational impact requires human confirmation.",
    icon: AlertTriangle,
    iconState: "warning",
  },
  error: {
    label: "Error",
    title: "Production contract conflict",
    description:
      "The selected artifact contains unresolved conflicts that block package readiness.",
    icon: CircleX,
    iconState: "error",
  },
  offline: {
    label: "Offline",
    title: "Future runtime evidence unavailable",
    description:
      "Runtime-dependent evidence remains explicitly outside this UI-contract milestone.",
    icon: CloudOff,
    iconState: "error",
  },
} as const;

export function ProductionStateSurface({
  state,
}: ProductionStateSurfaceProps) {
  const content =
    stateContent[state];

  return (
    <FlagshipPanel
      title="Production State"
      description="Stable visual treatment across every required pipeline state."
    >
      <div className="p-5">
        <section
          aria-live="polite"
          className="rounded-[22px] border border-cyan-300/30 bg-slate-950/26 p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <ExecutivePremiumIcon
                icon={content.icon}
                state={content.iconState}
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/68">
                  {content.label}
                </div>

                <h3 className="mt-1 text-lg font-semibold text-amber-400">
                  {content.title}
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-500/78">
                  {content.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/26 bg-cyan-300/[0.05] px-3 text-xs font-semibold text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <RefreshCw className="h-4 w-4" />
              Reset view
            </button>
          </div>
        </section>
      </div>
    </FlagshipPanel>
  );
}
