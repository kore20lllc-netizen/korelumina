import {
  useEffect,
  useState,
} from "react";

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
  LuminaBadge,
} from "@/components/lumina/workspace/primitives/LuminaBadge";

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
  flagshipAppearance,
} from "../presentation";

import { runtimeRead } from "@/services/runtime/runtimeReadQueue";
import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

interface ActivationReadinessItem {
  label: string;
  state:
    | "complete"
    | "partial"
    | "blocked";
  detail: string;
}

/*
 * UI-1: readiness is read from the Runtime's activation gate
 * (GET /api/executive/activation?prerequisites=true, ADR-0041). Nothing on
 * this panel is typed in. Reading the five certifications rebuilds their
 * candidates, so the first answer can take up to a minute.
 */

interface ActivationStatus {
  state: string;
  reason: string;
  autonomyLevel: string | null;
  prerequisites: Array<{ gate: string; state: string; id?: string | null }> | null;
}

type Loaded =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; activation: ActivationStatus; decisions: number };

const PREREQUISITE_LABELS: Record<string, { label: string; valid: string }> = {
  "day-zero-certification": {
    label: "Day-0 Genesis certification",
    valid: "Genesis history is certified for the current corpus.",
  },
  "educational-corpus-certification": {
    label: "Educational Corpus certification",
    valid: "The curriculum Chief Agent learns from is certified.",
  },
  "initial-competency-certification": {
    label: "Initial Competency certification",
    valid: "All competencies are certified against the current corpus.",
  },
  "initial-competency-human-acceptance": {
    label: "Human acceptance of competency",
    valid: "The owner accepted the competency certification.",
  },
  "production-workspace-authorization": {
    label: "Production workspace authorization",
    valid: "The owner authorized a production workspace.",
  },
};

function prerequisiteItem(
  prerequisite: { gate: string; state: string },
): ActivationReadinessItem {
  const known =
    PREREQUISITE_LABELS[prerequisite.gate] ??
    { label: prerequisite.gate, valid: "Valid." };

  if (prerequisite.state === "VALID") {
    return { label: known.label, state: "complete", detail: known.valid };
  }

  if (prerequisite.state === "STALE") {
    return {
      label: known.label,
      state: "partial",
      detail: "Knowledge changed since this was certified; re-certify before activating.",
    };
  }

  return {
    label: known.label,
    state: "blocked",
    detail: `Current state: ${prerequisite.state.toLowerCase().replace(/_/g, " ")}.`,
  };
}

function activationItem(
  activation: ActivationStatus,
): ActivationReadinessItem {
  switch (activation.state) {
    case "ACTIVE":
      return {
        label: "Activation record",
        state: "complete",
        detail: `Active at ${(activation.autonomyLevel ?? "unknown").toLowerCase().replace(/_/g, " ")} autonomy.`,
      };
    case "NOT_ACTIVATED":
      return {
        label: "Activation record",
        state: "partial",
        detail: "No activation recorded yet. Only the owner can record it.",
      };
    default:
      return {
        label: "Activation record",
        state: "blocked",
        detail: activation.reason,
      };
  }
}

function useActivationStatus(): Loaded {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await runtimeRead(
          `${RUNTIME_API}/api/executive/activation?prerequisites=true`,
          { cache: "no-store", headers: getRuntimeCallerHeaders() },
        );
        if (!response.ok) throw new Error(`Runtime answered ${response.status}`);
        const body = await response.json();
        if (!cancelled) {
          setLoaded({
            status: "ok",
            activation: body.activation as ActivationStatus,
            decisions: Array.isArray(body.history) ? body.history.length : 0,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLoaded({
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };

    void load();
    const timer = setInterval(() => void load(), 600_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return loaded;
}

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
  const loaded = useActivationStatus();

  const READINESS_ITEMS: ActivationReadinessItem[] =
    loaded.status === "ok"
      ? [
          ...(loaded.activation.prerequisites ?? []).map(prerequisiteItem),
          activationItem(loaded.activation),
        ]
      : [];

  const prerequisitesValid =
    loaded.status === "ok" &&
    (loaded.activation.prerequisites ?? []).length > 0 &&
    (loaded.activation.prerequisites ?? []).every(
      (prerequisite) => prerequisite.state === "VALID",
    );

  const posture =
    loaded.status === "loading"
      ? { label: "Checking", badge: "Checking", variant: "partial" as const, color: "text-sky-300" }
      : loaded.status === "error"
        ? { label: "Unknown", badge: "Runtime unavailable", variant: "blocked" as const, color: "text-rose-300" }
        : loaded.activation.state === "ACTIVE"
          ? { label: "Active", badge: "Active", variant: "complete" as const, color: "text-emerald-300" }
          : prerequisitesValid
            ? { label: "Ready", badge: "Ready to activate", variant: "complete" as const, color: "text-emerald-300" }
            : { label: "Not ready", badge: "Not ready", variant: "blocked" as const, color: "text-amber-400" };

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
      description="Live from the Runtime's activation gate. This page reads state only; activation is recorded by the owner's governed decision."
      toolbar={
        <LuminaBadge
          variant={posture.variant}
          className="min-h-7 text-[11px] leading-none"
        >
          {posture.badge}
        </LuminaBadge>
      }
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

          <div className={cn("mt-2 text-2xl font-semibold", posture.color)}>
            {posture.label}
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

      {loaded.status !== "ok" ? (
        <p className="px-4 pt-4 text-xs leading-5 text-sky-500/76">
          {loaded.status === "loading"
            ? "Reading the five certifications from the Runtime. This can take up to a minute."
            : `The Runtime could not be read (${loaded.message}). Nothing is shown rather than a guess.`}
        </p>
      ) : null}

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

                  <LuminaBadge
                    variant={toneForState(
                      item.state,
                    )}
                    className="min-h-7 text-[11px] leading-none"
                  >
                    {item.state}
                  </LuminaBadge>
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
            Activation, suspension and revocation are recorded only by the owner through the Runtime's governed activation decision (ADR-0041). {loaded.status === "ok" ? `${loaded.decisions} activation decision${loaded.decisions === 1 ? "" : "s"} on record.` : ""}
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
          title="This page reads state only. Activation is a governed owner decision recorded through the Runtime."
        >
          <LockKeyhole className="h-3.5 w-3.5" />
          Activation is recorded by the owner, not from this page
        </button>
      </div>
    </LuminaFlagshipPanel>
  );
}
