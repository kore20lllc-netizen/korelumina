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
  showProductBrand?: boolean;
  splitTitle?: boolean;
  executive?: boolean;
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
  primaryTitleClassName?: string;
  secondaryTitleClassName?: string;
}

export function LuminaWorkspaceBrand({
  showProductBrand = false,
  splitTitle = false,
  executive = false,
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
  primaryTitleClassName,
  secondaryTitleClassName,
}: LuminaWorkspaceBrandProps) {
  const splitWorkspace =
    splitTitle &&
    typeof workspace === "string"
      ? workspace.split(" ")
      : null;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        className,
      )}
    >
      {(showProductBrand ||
        status ||
        certification) && (
        <div className="flex flex-wrap items-center gap-3">
          {showProductBrand && (
            <LuminaBrand
              size="hero"
              className={cn(
                "text-5xl",
                productClassName,
              )}
            />
          )}

          {(status ||
            certification) && (
            <div className="flex flex-wrap items-center gap-2">
              {status}
              {certification}
            </div>
          )}
        </div>
      )}

      {(family || icon) && (
        <div
          className={cn(
            showProductBrand ? "mt-4" : "mb-3",
            "flex items-center gap-2",
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
          showProductBrand || family || icon
            ? "mt-3"
            : undefined,
          executive
            ? [
                "text-5xl font-bold",
                "leading-[0.92]",
                "tracking-[-0.045em]",
                "sm:text-6xl lg:text-7xl",
              ]
            : "text-4xl font-bold tracking-tight",
          workspaceClassName,
        )}
      >
        {splitWorkspace
          ? splitWorkspace.map(
              (part, index) => (
                <span
                  key={`${part}-${index}`}
                  className={cn(
                    "block",
                    index === 0
                      ? primaryTitleClassName
                      : secondaryTitleClassName,
                  )}
                >
                  {part}
                </span>
              ),
            )
          : workspace}
      </h1>

      {tagline && (
        <div
          className={cn(
            executive
              ? "mt-8 text-[11px]"
              : "mt-4 text-xs",
            "font-semibold uppercase",
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
