import type {
  ReactNode,
} from "react";

interface WorkspaceShellProps {
  executiveRibbon: ReactNode;
  productionNavigator: ReactNode;
  activityRail: ReactNode;
  spatialCanvas: ReactNode;
  inspectorDock: ReactNode;
  statusLayer?: ReactNode;
}

export function WorkspaceShell({
  executiveRibbon,
  productionNavigator,
  activityRail,
  spatialCanvas,
  inspectorDock,
  statusLayer,
}: WorkspaceShellProps) {
  return (
    <section
      aria-label="Knowledge Operations"
      className="
        relative flex h-full min-h-0 w-full flex-col
        overflow-hidden bg-transparent text-white
      "
    >
      <div
        className="
          relative z-30 shrink-0 px-4 pt-4
          lg:px-6 lg:pt-5
        "
      >
        {executiveRibbon}
      </div>

      <div
        className="
          relative z-20 shrink-0 px-4 pt-3
          lg:px-6
        "
      >
        {productionNavigator}
      </div>

      <div
        className="
          relative z-10 grid min-h-0 flex-1
          grid-cols-1 gap-3 px-4 pb-4 pt-3
          lg:grid-cols-[minmax(190px,0.22fr)_minmax(0,1fr)_minmax(260px,0.3fr)]
          lg:px-6 lg:pb-6
          xl:grid-cols-[224px_minmax(0,1fr)_320px]
        "
      >
        <aside
          aria-label="Knowledge production activity"
          className="hidden min-h-0 lg:block"
        >
          {activityRail}
        </aside>

        <main
          aria-label="Knowledge production canvas"
          className="min-h-0 min-w-0"
        >
          {spatialCanvas}
        </main>

        <aside
          aria-label="Knowledge inspector"
          className="hidden min-h-0 lg:block"
        >
          {inspectorDock}
        </aside>
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
