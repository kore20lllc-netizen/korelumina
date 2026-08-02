import type {
  ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

import {
  learningAppearance,
} from "./learningAppearance";

interface LearningPanelProps {
  title: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  emphasis?: "standard" | "strong";
  className?: string;
  contentClassName?: string;
}

export function LearningPanel({
  title,
  description,
  toolbar,
  children,
  emphasis = "standard",
  className,
  contentClassName,
}: LearningPanelProps) {
  return (
    <section
      className={cn(
        emphasis === "strong"
          ? learningAppearance.panelStrong
          : learningAppearance.panel,
        className,
      )}
    >
      <div
        className={cn(
          "relative flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between",
          learningAppearance.header,
        )}
      >
        <div className="min-w-0">
          <h2 className={learningAppearance.title}>
            {title}
          </h2>

          {description ? (
            <div
              className={cn(
                "mt-2 max-w-4xl",
                learningAppearance.description,
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

      <div className={cn("relative", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
