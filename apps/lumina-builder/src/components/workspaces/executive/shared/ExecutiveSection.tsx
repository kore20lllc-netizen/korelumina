import type {
  LucideIcon,
} from "lucide-react";
import type {
  ReactNode,
} from "react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";
import {
  LuminaPanelHeaderComposition,
} from "@/components/design-system/compositions/LuminaPanelHeaderComposition";
import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import type {
  PreviewTone,
} from "../design/executiveDesignPreview";

/*
 * EW-0: every Executive Office section uses the Knowledge Operations
 * flagship panel and header composition. A section that is not wired to
 * Runtime yet says so with the design-preview badge.
 */

export type ExecutiveSectionWiring =
  | "preview"
  | "partial"
  | "live";

export function DesignPreviewBadge({
  wiring = "preview",
}: {
  wiring?: ExecutiveSectionWiring;
}) {
  if (wiring === "partial") {
    return (
      <span
        title="Parts marked Live read Runtime. The rest still shows the approved design with a snapshot, until its ticket wires it."
        className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
        Partly live
      </span>
    );
  }

  return wiring === "live" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
      Live
    </span>
  ) : (
    <span
      title="This section shows the approved design with a snapshot of real data. It is wired to Runtime in a later ticket."
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
      Design preview · not wired
    </span>
  );
}

export const toneText: Record<PreviewTone, string> = {
  healthy: "text-emerald-200",
  active: "text-cyan-200",
  warning: "text-amber-200",
  error: "text-rose-200",
};

export const toneDot: Record<PreviewTone, string> = {
  healthy: "bg-emerald-300",
  active: "bg-cyan-300",
  warning: "bg-amber-300",
  error: "bg-rose-300",
};

export const tonePill: Record<PreviewTone, string> = {
  healthy: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  active: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
  warning: "border-amber-300/30 bg-amber-400/10 text-amber-200",
  error: "border-rose-300/30 bg-rose-400/10 text-rose-200",
};

export function ExecutiveSection({
  id,
  icon,
  iconState = "active",
  eyebrow,
  title,
  description,
  wiring = "preview",
  actions,
  children,
}: {
  id: string;
  icon: LucideIcon;
  iconState?: PreviewTone;
  eyebrow: string;
  title: string;
  description: string;
  wiring?: ExecutiveSectionWiring;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="min-w-0 scroll-mt-28"
    >
      <LuminaFlagshipPanel
        title={null}
        className="h-full [&>div:nth-of-type(3)]:hidden"
      >
        <div className="relative z-10 grid gap-5 p-5 sm:p-6">
          <LuminaPanelHeaderComposition
            alignment="start"
            responsiveAction
            iconRegion={
              <ExecutivePremiumIcon
                icon={icon}
                state={iconState}
              />
            }
            copyRegion={
              <>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
                  {eyebrow}
                </div>
                <h2
                  id={`${id}-title`}
                  className="mt-1 text-xl font-semibold tracking-[-0.025em] text-amber-400"
                >
                  {title}
                </h2>
                <p className="mt-1.5 max-w-3xl text-sm leading-6 text-sky-300/70">
                  {description}
                </p>
              </>
            }
            trailingRegion={
              <div className="flex flex-wrap items-center justify-end gap-2">
                {actions}
                <DesignPreviewBadge wiring={wiring} />
              </div>
            }
          />
          {children}
        </div>
      </LuminaFlagshipPanel>
    </section>
  );
}

export function ExecutiveTile({
  label,
  value,
  detail,
  tone = "active",
  icon,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: PreviewTone;
  icon?: LucideIcon;
}) {
  return (
    <LuminaFlagshipCard
      as="article"
      className="rounded-[20px] p-4"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[tone]}`} />
              {label}
            </div>
            <div className={`mt-2 text-xl font-semibold ${toneText[tone]}`}>
              {value}
            </div>
          </div>
          {icon ? (
            <ExecutivePremiumIcon
              icon={icon}
              state={tone}
            />
          ) : null}
        </div>
        {detail ? (
          <div className="mt-1 text-xs leading-5 text-sky-300/60">
            {detail}
          </div>
        ) : null}
      </div>
    </LuminaFlagshipCard>
  );
}

export function ExecutiveCardHeading({
  icon,
  tone = "active",
  children,
}: {
  icon: LucideIcon;
  tone?: PreviewTone;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">
      <ExecutivePremiumIcon
        icon={icon}
        state={tone}
      />
      {children}
    </div>
  );
}

export function NotWiredButton({
  children,
  tone = "active",
}: {
  children: ReactNode;
  tone?: PreviewTone;
}) {
  return (
    <button
      type="button"
      disabled
      title="Not wired yet: this control becomes active when its section is wired to Runtime."
      className={`cursor-not-allowed rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-60 ${tonePill[tone]}`}
    >
      {children}
    </button>
  );
}
