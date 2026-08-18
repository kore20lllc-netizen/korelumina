import type {
  ReactNode,
} from "react";

export interface ExecutiveWorkspaceShellProps {
  ariaLabel: string;
  executiveRibbon: ReactNode;
  primaryPanel: ReactNode;
  activityRail: ReactNode;
  spatialCanvas: ReactNode;
  inspectorDock: ReactNode;
  statusLayer?: ReactNode;
}

export function ExecutiveWorkspaceShell({
  ariaLabel,
  executiveRibbon,
  primaryPanel,
  activityRail,
  spatialCanvas,
  inspectorDock,
  statusLayer,
}: ExecutiveWorkspaceShellProps) {
  return (
    <section
      aria-label={ariaLabel}
      className="
        relative flex h-full min-h-0 w-full flex-col
        overflow-x-hidden overflow-y-auto overscroll-contain
        bg-transparent text-white
      "
    >
      <section
        className="
          relative z-30
          grid gap-6
          px-6 pt-6
          xl:grid-cols-[380px_minmax(0,1fr)]
        "
      >
        <div className="flex h-full min-w-0">
          {executiveRibbon}
        </div>

        {primaryPanel}
      </section>

      <div
        className="
          relative z-10
          flex flex-col
          gap-6
          px-6 pb-6 pt-5
        "
      >
        <main
          aria-label={`${ariaLabel} canvas`}
          className="min-w-0"
        >
          {spatialCanvas}
        </main>

        <section
          className="
            grid
            gap-6
            lg:grid-cols-[minmax(0,1fr)_360px]
          "
        >
          <section
            aria-label={`${ariaLabel} activity`}
          >
            {activityRail}
          </section>

          <aside
            aria-label={`${ariaLabel} inspector`}
          >
            {inspectorDock}
          </aside>
        </section>
      </div>

      {statusLayer ? (
        <div
          className="
            pointer-events-none absolute inset-x-0 bottom-0
            z-50
          "
        >
          {statusLayer}
        </div>
      ) : null}
    </section>
  );
}
