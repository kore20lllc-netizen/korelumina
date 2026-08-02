import type {
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

import {
  flagshipAppearance,
} from "./flagshipAppearance";

interface FlagshipPanelProps {
  title: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FlagshipPanel({
  title,
  description,
  toolbar,
  children,
  className,
}: FlagshipPanelProps) {
  return (
    <section
      className={cn(
        flagshipAppearance.panel,
        className,
      )}
    >
      <div className={flagshipAppearance.panelReflection} />

      <div
        className={cn(
          "flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between",
          flagshipAppearance.panelHeader,
        )}
      >
        <div className="min-w-0">
          <h2 className={flagshipAppearance.panelTitle}>
            {title}
          </h2>

          {description ? (
            <div
              className={cn(
                "mt-2 max-w-4xl",
                flagshipAppearance.description,
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
