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

export interface LuminaCompositionSurfaceProps
  extends ComponentPropsWithoutRef<
    typeof LuminaSurface
  > {
  children: ReactNode;
}

export function LuminaCompositionSurface({
  children,
  className,
  ...props
}: LuminaCompositionSurfaceProps) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-6",
          "rounded-[calc(var(--lumina-radius-surface)*1.35)]",
          "opacity-80 blur-3xl",
          "[background:radial-gradient(circle_at_14%_20%,rgba(124,92,255,0.43),transparent_40%),radial-gradient(circle_at_86%_72%,rgba(34,211,238,0.31),transparent_38%),radial-gradient(circle_at_48%_110%,rgba(230,167,42,0.28),transparent_44%)]",
        )}
      />

      <LuminaSurface
        {...props}
        className={cn(
          "relative isolate overflow-hidden",
          className,
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-0",
            "[background:radial-gradient(circle_at_10%_8%,rgba(124,92,255,0.38),transparent_37%),radial-gradient(circle_at_82%_16%,rgba(34,211,238,0.29),transparent_35%),radial-gradient(circle_at_48%_48%,rgba(247,215,116,0.16),transparent_31%),radial-gradient(circle_at_52%_82%,rgba(255,255,255,0.12),transparent_29%),radial-gradient(circle_at_34%_110%,rgba(230,167,42,0.25),transparent_42%)]",
          )}
        />

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-[8%] top-0 z-0 h-px",
            "[background:linear-gradient(90deg,transparent,rgba(247,215,116,0.92),rgba(255,255,255,0.84),rgba(90,200,255,0.88),transparent)]",
            "[box-shadow:0_0_48px_rgba(90,200,255,0.52),0_0_72px_rgba(247,215,116,0.24)]",
          )}
        />

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -left-20 -top-24 z-0",
            "h-72 w-72 rounded-full blur-3xl",
            "[background:rgba(124,92,255,0.27)]",
          )}
        />

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -bottom-32 -right-16 z-0",
            "h-72 w-72 rounded-full blur-3xl",
            "[background:rgba(34,211,238,0.21)]",
          )}
        />

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-1/2 top-[42%] z-0",
            "h-64 w-[34rem] max-w-[86%]",
            "-translate-x-1/2 -translate-y-1/2",
            "rounded-full blur-3xl",
            "[background:radial-gradient(ellipse_at_center,rgba(247,215,116,0.19),rgba(230,167,42,0.09)_42%,transparent_72%)]",
          )}
        />

        {children}
      </LuminaSurface>
    </div>
  );
}

export default LuminaCompositionSurface;
