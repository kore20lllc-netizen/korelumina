import type {
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

import type {
  LuminaCompositionPresentation,
} from "./LuminaCompositionSurface";

import {
  LuminaCompositionSurface,
} from "./LuminaCompositionSurface";

export interface LuminaWorkspaceHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
  children?: ReactNode;
  className?: string;
  presentation?: LuminaCompositionPresentation;
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
  presentation = "default",
}: LuminaWorkspaceHeaderProps) {
  const supportingText =
    subtitle ?? description;

  return (
    <LuminaCompositionSurface
      variant="hero"
      presentation={presentation}
      className={cn(
        "min-h-[24rem]",
        "px-6 py-7",
        "sm:px-8 sm:py-9",
        "lg:px-10 lg:py-10",
        className,
      )}
    >
      <header className="relative z-10 flex min-h-full flex-col gap-8">
        <div
          className={cn(
            "grid gap-8",
            "lg:grid-cols-[minmax(0,1fr)_minmax(24rem,40rem)]",
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
                "flex w-full min-w-0 flex-col gap-5",
                "lg:w-full",
                "lg:max-w-[40rem]",
                "lg:items-stretch",
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
                    "min-w-0",
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
              "mt-auto border-t pt-8",
              "[border-color:var(--lumina-border-standard)]",
            )}
          >
            {children}
          </div>
        )}
      </header>
    </LuminaCompositionSurface>
  );
}

export default LuminaWorkspaceHeader;
