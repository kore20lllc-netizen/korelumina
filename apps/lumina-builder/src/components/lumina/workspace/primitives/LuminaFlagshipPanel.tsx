import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

export interface LuminaFlagshipPanelProps
  extends Omit<
    ComponentPropsWithoutRef<"section">,
    "title"
  > {
  title: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}

const flagshipPanelAppearance = {
  panel: [
    "group relative overflow-hidden rounded-[30px]",
    "border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20",
    "bg-slate-950/48 backdrop-blur-[44px] backdrop-saturate-[170%]",
    "shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_30px_rgba(37,99,235,.16),0_28px_160px_rgba(0,0,0,.40),inset_0_0_22px_rgba(56,189,248,.05)]",
  ].join(" "),

  ambient:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_2%,rgba(124,58,237,.30),transparent_36%),radial-gradient(circle_at_29%_42%,rgba(217,119,6,.17),transparent_27%),radial-gradient(circle_at_74%_64%,rgba(67,56,202,.13),transparent_30%),radial-gradient(circle_at_91%_14%,rgba(34,211,238,.035),transparent_22%),radial-gradient(circle_at_57%_86%,rgba(236,72,153,.075),transparent_18%),linear-gradient(180deg,rgba(255,255,255,.018),transparent_24%,rgba(2,6,23,.10))]",

  reflection:
    "pointer-events-none absolute inset-x-[7%] top-0 h-px opacity-90 [background:linear-gradient(90deg,transparent_0%,rgba(96,165,250,.10)_12%,rgba(247,215,116,.42)_34%,rgba(255,255,255,.62)_50%,rgba(125,211,252,.28)_69%,rgba(59,130,246,.08)_88%,transparent_100%)] [box-shadow:0_0_22px_rgba(125,211,252,.14),0_0_40px_rgba(247,215,116,.08)]",

  header: [
    "relative border-b border-cyan-300/18",
    "bg-[linear-gradient(180deg,rgba(15,23,42,0.20),rgba(2,6,23,0.04))]",
  ].join(" "),

  title: [
    "text-xl font-semibold tracking-[-0.025em]",
    "text-amber-500",
    "drop-shadow-[0_0_20px_rgba(180,83,9,0.22)]",
  ].join(" "),

  description:
    "text-sm leading-6 text-sky-400/78",
} as const;

export function LuminaFlagshipPanel({
  title,
  description,
  toolbar,
  children,
  className,
  ...sectionProps
}: LuminaFlagshipPanelProps) {
  return (
    <section
      {...sectionProps}
      className={cn(
        flagshipPanelAppearance.panel,
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={
          flagshipPanelAppearance.ambient
        }
      />

      <div
        aria-hidden="true"
        className={
          flagshipPanelAppearance.reflection
        }
      />

      <div
        className={cn(
          "flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between",
          flagshipPanelAppearance.header,
        )}
      >
        <div className="min-w-0">
          <h2
            className={
              flagshipPanelAppearance.title
            }
          >
            {title}
          </h2>

          {description ? (
            <div
              className={cn(
                "mt-2 max-w-4xl",
                flagshipPanelAppearance.description,
              )}
            >
              {description}
            </div>
          ) : null}
        </div>

        {toolbar ? (
          <div className="shrink-0">
            {toolbar}
          </div>
        ) : null}
      </div>

      {children}
    </section>
  );
}

export default LuminaFlagshipPanel;
