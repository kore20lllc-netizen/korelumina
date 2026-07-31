import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

import {
  LuminaSurface,
} from "@/components/lumina/surface/LuminaSurface";

import {
  cn,
} from "@/lib/utils";

export type LuminaCompositionPresentation =
  | "default"
  | "executive";

export interface LuminaCompositionSurfaceProps
  extends ComponentPropsWithoutRef<
    typeof LuminaSurface
  > {
  children: ReactNode;
  presentation?: LuminaCompositionPresentation;
}

export function LuminaCompositionSurface({
  children,
  className,
  presentation = "default",
  ...props
}: LuminaCompositionSurfaceProps) {
  const isExecutive =
    presentation === "executive";

  return (
    <div
      className={cn(
        "relative",
        isExecutive &&
          "isolate",
      )}
      data-lumina-presentation={
        presentation
      }
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute",
          "rounded-[calc(var(--lumina-radius-surface)*1.35)]",
          "transition-opacity duration-500",
          isExecutive
            ? [
                "-inset-8",
                "opacity-70 blur-[72px]",
                "[background:radial-gradient(circle_at_12%_16%,rgba(124,92,255,0.52),transparent_38%),radial-gradient(circle_at_88%_28%,rgba(34,211,238,0.38),transparent_36%),radial-gradient(circle_at_72%_92%,rgba(16,185,129,0.24),transparent_40%),radial-gradient(circle_at_30%_108%,rgba(230,167,42,0.32),transparent_44%)]",
              ]
            : [
                "-inset-6",
                "opacity-34 blur-3xl",
                "[background:radial-gradient(circle_at_14%_20%,rgba(124,92,255,0.43),transparent_40%),radial-gradient(circle_at_86%_72%,rgba(34,211,238,0.31),transparent_38%),radial-gradient(circle_at_48%_110%,rgba(230,167,42,0.28),transparent_44%)]",
              ],
        )}
      />

      {isExecutive ? (
        <>
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute",
              "-left-20 top-8",
              "h-56 w-56 rounded-full",
              "opacity-55 blur-[84px]",
              "[background:radial-gradient(circle,rgba(124,92,255,0.72),rgba(124,92,255,0.14)_48%,transparent_72%)]",
            )}
          />

          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute",
              "-right-16 top-14",
              "h-52 w-52 rounded-full",
              "opacity-50 blur-[82px]",
              "[background:radial-gradient(circle,rgba(34,211,238,0.66),rgba(34,211,238,0.12)_48%,transparent_72%)]",
            )}
          />

          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute",
              "bottom-[-4.5rem] left-[18%]",
              "h-44 w-72 rounded-full",
              "opacity-45 blur-[86px]",
              "[background:radial-gradient(ellipse_at_center,rgba(230,167,42,0.54),rgba(230,167,42,0.1)_48%,transparent_74%)]",
            )}
          />

          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute",
              "bottom-[-5rem] right-[12%]",
              "h-44 w-64 rounded-full",
              "opacity-35 blur-[88px]",
              "[background:radial-gradient(ellipse_at_center,rgba(16,185,129,0.48),rgba(16,185,129,0.08)_48%,transparent_74%)]",
            )}
          />
        </>
      ) : null}

      <LuminaSurface
        {...props}
        className={cn(
          "relative isolate overflow-hidden",
          isExecutive && [
            "ring-1 ring-inset ring-white/[0.08]",
            "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.035),0_28px_90px_rgba(2,6,23,0.48),0_0_0_1px_rgba(255,255,255,0.025)]",
          ],
          className,
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-0",
            isExecutive
              ? "[background:radial-gradient(circle_at_8%_4%,rgba(124,92,255,0.42),transparent_36%),radial-gradient(circle_at_90%_10%,rgba(34,211,238,0.31),transparent_34%),radial-gradient(circle_at_78%_82%,rgba(16,185,129,0.14),transparent_34%),radial-gradient(circle_at_42%_46%,rgba(247,215,116,0.14),transparent_30%),radial-gradient(circle_at_30%_110%,rgba(230,167,42,0.27),transparent_43%),linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.012)_44%,rgba(2,6,23,0.12))]"
              : "[background:radial-gradient(circle_at_10%_8%,rgba(124,92,255,0.38),transparent_37%),radial-gradient(circle_at_82%_16%,rgba(34,211,238,0.29),transparent_35%),radial-gradient(circle_at_48%_48%,rgba(247,215,116,0.16),transparent_31%),radial-gradient(circle_at_52%_82%,rgba(255,255,255,0.12),transparent_29%),radial-gradient(circle_at_34%_110%,rgba(230,167,42,0.25),transparent_42%)]",
          )}
        />

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-[8%] top-0 z-0 h-px",
            isExecutive
              ? [
                  "inset-x-[5%]",
                  "[background:linear-gradient(90deg,transparent,rgba(124,92,255,0.72),rgba(247,215,116,0.98),rgba(255,255,255,0.92),rgba(34,211,238,0.88),transparent)]",
                  "[box-shadow:0_0_34px_rgba(124,92,255,0.38),0_0_54px_rgba(90,200,255,0.5),0_0_76px_rgba(247,215,116,0.22)]",
                ]
              : [
                  "[background:linear-gradient(90deg,transparent,rgba(247,215,116,0.92),rgba(255,255,255,0.84),rgba(90,200,255,0.88),transparent)]",
                  "[box-shadow:0_0_48px_rgba(90,200,255,0.52),0_0_72px_rgba(247,215,116,0.24)]",
                ],
          )}
        />

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-1/2 z-0",
            "-translate-x-1/2 -translate-y-1/2",
            "rounded-full blur-3xl",
            isExecutive
              ? [
                  "top-[38%]",
                  "h-72 w-[42rem] max-w-[92%]",
                  "[background:radial-gradient(ellipse_at_center,rgba(247,215,116,0.2),rgba(230,167,42,0.08)_38%,rgba(124,92,255,0.05)_58%,transparent_76%)]",
                ]
              : [
                  "top-[42%]",
                  "h-64 w-[34rem] max-w-[86%]",
                  "[background:radial-gradient(ellipse_at_center,rgba(247,215,116,0.19),rgba(230,167,42,0.09)_42%,transparent_72%)]",
                ],
          )}
        />

        {isExecutive ? (
          <>
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 z-0",
                "opacity-[0.055]",
                "[background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)]",
                "[background-size:48px_48px]",
                "[mask-image:linear-gradient(to_bottom,black,transparent_72%)]",
              )}
            />

            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute",
                "inset-x-0 bottom-0 z-0 h-28",
                "[background:linear-gradient(to_top,rgba(2,6,23,0.22),transparent)]",
              )}
            />
          </>
        ) : null}

        {children}
      </LuminaSurface>
    </div>
  );
}

export default LuminaCompositionSurface;
