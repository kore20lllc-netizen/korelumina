import type {
  ReactNode,
} from "react";

import {
  LuminaBrand,
} from "@/components/lumina/brand";

import {
  cn,
} from "@/lib/utils";

export interface LuminaWorkspaceBrandProps {
  splitTitle?: boolean;

  workspace: ReactNode;
  family?: ReactNode;
  tagline?: ReactNode;
  status?: ReactNode;
  certification?: ReactNode;
  icon?: ReactNode;
  className?: string;
  productClassName?: string;
  workspaceClassName?: string;
  familyClassName?: string;
  taglineClassName?: string;
}

export function LuminaWorkspaceBrand({
  splitTitle = false,
  workspace,
  family,
  tagline,
  status,
  certification,
  icon,
  className,
  productClassName,
  workspaceClassName,
  familyClassName,
  taglineClassName,
}: LuminaWorkspaceBrandProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <LuminaBrand
          size="hero"
          className={cn(
            "text-5xl",
            productClassName,
          )}
        />

        {(status ||
          certification) && (
          <div className="flex flex-wrap items-center gap-2">
            {status}

            {certification}
          </div>
        )}
      </div>

      {(family || icon) && (
        <div
          className={cn(
            "mt-4 flex items-center gap-2",
            "text-[10px] font-semibold uppercase",
            "tracking-[0.22em] text-muted-foreground",
            familyClassName,
          )}
        >
          {icon && (
            <span className="flex shrink-0 items-center justify-center">
              {icon}
            </span>
          )}

          {family}
        </div>
      )}

      <h1
        className={cn(
          "mt-3 text-4xl font-bold tracking-tight",
          workspaceClassName,
        )}
      >
        {splitTitle && typeof workspace === "string"
  ? workspace.split(" ").map((part) => (
      <span key={part} className="block">
        {part}
      </span>
    ))
  : workspace}
      </h1>

      {tagline && (
        <div
          className={cn(
            "mt-4 text-xs font-semibold uppercase",
            "tracking-[0.42em] text-muted-foreground",
            taglineClassName,
          )}
        >
          {tagline}
        </div>
      )}
    </div>
  );
}

export default LuminaWorkspaceBrand;
