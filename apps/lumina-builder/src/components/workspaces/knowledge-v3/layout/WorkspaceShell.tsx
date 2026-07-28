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

        <section
          className={[
            "relative overflow-hidden",
            "rounded-[32px]",
            "border border-cyan-400/35",
            "bg-black/30 backdrop-blur-2xl",
            "shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_36px_rgba(34,211,238,0.12),0_32px_90px_rgba(0,0,0,0.45)]",
          ].join(" ")}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute inset-0 rounded-[32px] ring-1 ring-inset ring-cyan-300/20" />
          </div>

          <div className="relative h-full px-8 py-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan">
                  Production Pipeline
                </div>

                <h2 className="mt-3 text-2xl font-semibold text-cyan">
                  Institutional Knowledge Production
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                  Acquire, validate, compile, and operationalize institutional knowledge.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Runtime
                </div>

                <div className="mt-1 text-sm font-semibold text-emerald-300">
                  Operational
                </div>
              </div>
            </div>

            <div className="my-8 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

            <div className="mt-2">
              {productionNavigator}
            </div>
          </div>
        </section>
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
          aria-label="Knowledge production canvas"
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
            aria-label="Knowledge production activity"
          >
            {activityRail}
          </section>

          <aside
            aria-label="Knowledge inspector"
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
