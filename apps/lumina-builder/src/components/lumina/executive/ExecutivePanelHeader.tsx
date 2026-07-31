import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ExecutivePanelHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
  className?: string;
}

export function ExecutivePanelHeader({
  eyebrow,
  title,
  description,
  subtitle,
  actions,
  metrics,
  className,
}: ExecutivePanelHeaderProps) {
  const supportingText =
    subtitle ?? description;

  return (
    <header
      className={cn(
        "grid gap-8",
        "lg:grid-cols-[minmax(0,1fr)_minmax(24rem,40rem)]",
        "lg:items-start",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
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
        ) : null}

        <div className="min-w-0">
          {title}
        </div>

        {supportingText ? (
          <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
            {supportingText}
          </p>
        ) : null}
      </div>

      {(actions || metrics) ? (
        <div
          className={cn(
            "flex w-full min-w-0 flex-col gap-5",
            "lg:w-full",
            "lg:max-w-[40rem]",
            "lg:items-stretch",
          )}
        >
          {actions ? (
            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              {actions}
            </div>
          ) : null}

          {metrics ? (
            <div className="w-full min-w-0">
              {metrics}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
