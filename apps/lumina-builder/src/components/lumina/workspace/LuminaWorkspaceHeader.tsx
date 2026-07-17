import type {
  ReactNode,
} from "react";

import {
  LuminaSurface,
} from "@/components/lumina/surface/LuminaSurface";

import {
  cn,
} from "@/lib/utils";

export interface LuminaWorkspaceHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function LuminaWorkspaceHeader({
  eyebrow,
  title,
  description,
  subtitle,
  actions,
  metrics,
  children,
  className,
}: LuminaWorkspaceHeaderProps) {
  const supportingText =
    subtitle ?? description;

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
        variant="hero"
        className={cn(
          "relative isolate min-h-[24rem] overflow-hidden",
          "px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10",
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
            "h-64 w-[34rem] max-w-[86%] -translate-x-1/2 -translate-y-1/2",
            "rounded-full blur-3xl",
            "[background:radial-gradient(ellipse_at_center,rgba(247,215,116,0.19),rgba(230,167,42,0.09)_42%,transparent_72%)]",
          )}
        />

        <header className="relative z-10 flex min-h-full flex-col gap-8">
          <div
            className={cn(
              "grid gap-8",
              "lg:grid-cols-[minmax(0,1fr)_auto]",
              "lg:items-start",
            )}
          >
            <div className="min-w-0">
              {eyebrow && (
                <div
                  className={cn(
                    "mb-4 inline-flex items-center gap-2",
                    "rounded-full border px-3 py-1",
                    "text-[10px] font-semibold uppercase",
                    "tracking-[0.22em] text-muted-foreground",
                    "[border-color:var(--lumina-border-standard)]",
                    "[background:var(--lumina-surface-interactive)]",
                    "[backdrop-filter:var(--lumina-blur-surface)]",
                  )}
                >
                  {eyebrow}
                </div>
              )}

              <div className="min-w-0">
                {title}
              </div>

              {supportingText && (
                <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                  {supportingText}
                </p>
              )}
            </div>

            {(actions || metrics) && (
              <div
                className={cn(
                  "flex flex-col gap-4",
                  "w-fit",
                  "max-w-full",
                  "justify-self-end",
                  "lg:items-end",
                )}
              >
                {actions && (
                  <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                    {actions}
                  </div>
                )}

                {metrics && (
                  <div
                    className={cn(
                      "w-full",
                      "lg:w-auto",
                      "lg:min-w-[42rem]",
                    )}
                  >
                    {metrics}
                  </div>
                )}
              </div>
            )}
          </div>

          {children && (
            <div
              className={cn(
                "mt-auto border-t pt-6",
                "[border-color:var(--lumina-border-standard)]",
              )}
            >
              {children}
            </div>
          )}
        </header>
      </LuminaSurface>
    </div>
  );
}

export default LuminaWorkspaceHeader;
