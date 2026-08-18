import type {
  ReactNode,
} from "react";

interface ExecutiveFilterSurfaceProps {
  ariaLabel: string;
  summary: ReactNode;
  primaryControls: ReactNode;
  actions: ReactNode;
  activeFilters?: ReactNode;
  advancedControls?: ReactNode;
}

export function ExecutiveFilterSurface({
  ariaLabel,
  summary,
  primaryControls,
  actions,
  activeFilters,
  advancedControls,
}: ExecutiveFilterSurfaceProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={[
        "rounded-[20px] border border-blue-400/60 ring-1 ring-inset ring-cyan-300/16",
        "bg-[linear-gradient(135deg,rgba(8,15,38,.62),rgba(20,11,48,.54),rgba(7,17,40,.62))]",
        "px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        {summary}

        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {primaryControls}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      </div>

      {activeFilters ? (
        <div
          aria-live="polite"
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-cyan-300/10 pt-3"
        >
          {activeFilters}
        </div>
      ) : null}

      {advancedControls ? (
        <div
          className={[
            "mt-3 grid gap-3 border-t border-violet-300/12 pt-3",
            "sm:grid-cols-2 lg:grid-cols-4",
          ].join(" ")}
        >
          {advancedControls}
        </div>
      ) : null}
    </section>
  );
}
