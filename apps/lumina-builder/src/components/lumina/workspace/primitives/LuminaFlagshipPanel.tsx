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
    "relative overflow-hidden rounded-[30px] border",
    "border-cyan-300/58",
    "bg-[radial-gradient(circle_at_14%_0%,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_78%_14%,rgba(147,51,234,0.11),transparent_32%),radial-gradient(circle_at_38%_90%,rgba(180,83,9,0.08),transparent_28%),linear-gradient(135deg,rgba(2,6,23,0.60),rgba(15,10,40,0.57),rgba(2,8,26,0.59))]",
    "ring-1 ring-inset ring-cyan-100/18",
    "shadow-[0_0_0_1px_rgba(59,130,246,0.14),0_0_34px_rgba(37,99,235,0.12),0_24px_72px_rgba(2,6,23,0.40),inset_0_1px_0_rgba(255,255,255,0.07)]",
    "backdrop-blur-[50px] backdrop-saturate-[180%]",
  ].join(" "),

  reflection:
    "pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/48 to-transparent",

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
