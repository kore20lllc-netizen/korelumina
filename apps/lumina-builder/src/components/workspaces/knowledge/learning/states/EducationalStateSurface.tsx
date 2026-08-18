import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  cn,
} from "@/lib/utils";

import type {
  EducationalUiState,
} from "../model";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

interface EducationalStateSurfaceProps {
  state: EducationalUiState;
  onRecover(): void;
}

const STATE_COPY: Record<
  EducationalUiState,
  {
    title: string;
    description: string;
    affordance: string;
  }
> = {
  empty: {
    title:
      "No educational assets in this modeled view",
    description:
      "The layout remains stable while no fixture-backed curriculum is visible.",
    affordance:
      "Restore fixture data",
  },
  loading: {
    title:
      "Preparing educational posture",
    description:
      "The modeled curriculum, dependency graph and competency posture are being assembled.",
    affordance:
      "Return to ready state",
  },
  processing: {
    title:
      "Recalculating educational coverage",
    description:
      "Modeled completion, authority distribution and activation-readiness views are being refreshed.",
    affordance:
      "Return to ready state",
  },
  success: {
    title:
      "Educational dashboard ready",
    description:
      "The modeled UI contract is available for visual inspection.",
    affordance:
      "Reset dashboard",
  },
  partial: {
    title:
      "Educational coverage is partial",
    description:
      "Some curriculum classes are represented while unresolved constitutional and domain gaps remain visible.",
    affordance:
      "Restore complete modeled view",
  },
  warning: {
    title:
      "Educational review required",
    description:
      "One or more curriculum areas require governance attention before readiness can improve.",
    affordance:
      "Restore complete modeled view",
  },
  error: {
    title:
      "Educational view could not be assembled",
    description:
      "The production error surface preserves navigation, context and recovery controls.",
    affordance:
      "Recover modeled view",
  },
  offline: {
    title:
      "Authoritative services are offline",
    description:
      "The UI-contract view remains inspectable with local fixture data and makes no live-state claims.",
    affordance:
      "Use local modeled view",
  },
};

function iconForState(
  state: EducationalUiState,
) {
  if (
    state === "loading" ||
    state === "processing"
  ) {
    return LoaderCircle;
  }

  if (state === "offline") {
    return CloudOff;
  }

  if (state === "error") {
    return ShieldAlert;
  }

  if (
    state === "warning" ||
    state === "partial"
  ) {
    return AlertTriangle;
  }

  if (state === "empty") {
    return Sparkles;
  }

  return CheckCircle2;
}

function statePresentation(
  state: EducationalUiState,
) {
  switch (state) {
    case "error":
      return {
        iconState:
          "error" as const,
        glow:
          "radial-gradient(circle_at_50%_38%,rgba(244,63,94,0.12),transparent_36%)",
        eyebrow:
          "Educational system state",
      };
    case "offline":
      return {
        iconState:
          "active" as const,
        glow:
          "radial-gradient(circle_at_50%_38%,rgba(148,163,184,0.10),transparent_36%)",
        eyebrow:
          "Authoritative connectivity",
      };
    case "warning":
    case "partial":
      return {
        iconState:
          "warning" as const,
        glow:
          "radial-gradient(circle_at_50%_38%,rgba(245,158,11,0.12),transparent_36%)",
        eyebrow:
          "Educational governance state",
      };
    case "loading":
    case "processing":
      return {
        iconState:
          "active" as const,
        glow:
          "radial-gradient(circle_at_50%_38%,rgba(34,211,238,0.12),transparent_36%)",
        eyebrow:
          "Educational computation",
      };
    default:
      return {
        iconState:
          "active" as const,
        glow:
          "radial-gradient(circle_at_50%_38%,rgba(167,139,250,0.12),transparent_36%)",
        eyebrow:
          "Educational workspace state",
      };
  }
}

export function EducationalStateSurface({
  state,
  onRecover,
}: EducationalStateSurfaceProps) {
  if (state === "success") {
    return null;
  }

  const Icon = iconForState(state);
  const presentation =
    statePresentation(state);

  return (
    <LuminaFlagshipPanel
      emphasis="strong"
      className="overflow-hidden"
    >
      <section
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          backgroundImage:
            presentation.glow,
        }}
        className="
          relative flex min-h-[300px] flex-col
          items-center justify-center overflow-hidden
          px-6 py-12 text-center
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-x-[12%] top-0 h-px
            bg-gradient-to-r
            from-transparent via-cyan-200/42 to-transparent
          "
        />

        <div
          className={cn(
            "w-fit",
            state === "loading" ||
              state === "processing"
              ? "[&>div>svg]:animate-spin motion-reduce:[&>div>svg]:animate-none"
              : "",
          )}
        >
          <ExecutivePremiumIcon
            icon={Icon}
            state={presentation.iconState}
          />
        </div>

        <div
          className="
            mt-6 text-[10px] font-semibold uppercase
            tracking-[0.18em] text-violet-300/78
          "
        >
          {presentation.eyebrow}
        </div>

        <h3
          className="
            mt-2 max-w-2xl text-xl font-semibold
            tracking-[-0.02em] text-amber-500
            drop-shadow-[0_0_18px_rgba(180,83,9,0.16)]
          "
        >
          {STATE_COPY[state].title}
        </h3>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-500/78">
          {STATE_COPY[state].description}
        </p>

        <LuminaButton
          type="button"
          variant="toolbar"
          size="sm"
          className="
            mt-6 border-cyan-300/34
            bg-slate-950/58 text-sky-200
            shadow-[inset_0_1px_0_rgba(186,230,253,0.06),0_8px_22px_rgba(2,6,23,0.20)]
            hover:border-cyan-200/58 hover:bg-cyan-300/[0.06]
            focus-visible:ring-cyan-300/42
          "
          onClick={onRecover}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {STATE_COPY[state].affordance}
        </LuminaButton>
      </section>
    </LuminaFlagshipPanel>
  );
}
