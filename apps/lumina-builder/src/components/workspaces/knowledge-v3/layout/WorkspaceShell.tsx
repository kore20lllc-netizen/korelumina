import type {
  ReactNode,
} from "react";

interface WorkspaceShellProps {
  executiveRibbon: ReactNode;
  domainNavigator: ReactNode;
  workspaceHeader: ReactNode;
  productionNavigator: ReactNode;
  activityRail: ReactNode;
  spatialCanvas: ReactNode;
  inspectorDock: ReactNode;
  compactContent?: boolean;
  statusLayer?: ReactNode;
  educationalCommandDeck?: ReactNode;
}

export function WorkspaceShell({
  executiveRibbon,
  domainNavigator,
  workspaceHeader,
  productionNavigator,
  activityRail,
  spatialCanvas,
  inspectorDock,
  compactContent = false,
  statusLayer,
  educationalCommandDeck,
}: WorkspaceShellProps) {
  const hasProductionNavigator =
    productionNavigator !== null;

  const hasActivityRail =
    activityRail !== null;

  const hasInspector =
    inspectorDock !== null;

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

        <div className="space-y-4">
          {domainNavigator}

          <section
            className={`
              relative overflow-hidden
              rounded-[32px]
              border border-cyan-400/35
              bg-black/30 backdrop-blur-2xl
              shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_36px_rgba(34,211,238,0.12),0_32px_90px_rgba(0,0,0,0.45)]
            `}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="absolute inset-0 rounded-[32px] ring-1 ring-inset ring-cyan-300/20" />
            </div>

            <div className="relative h-full px-8 py-8">
              {workspaceHeader}

          {educationalCommandDeck ? (
            <div className="mt-6">
              {educationalCommandDeck}
            </div>
          ) : null}

              {hasProductionNavigator && (
                <>
                  <div className="my-8 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

                  <div className="mt-2">
                    {productionNavigator}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </section>

      <div
        className={[
          "relative z-10 flex flex-col gap-6 px-6 pb-6 pt-5",
          compactContent
            ? "max-w-[1800px]"
            : "",
        ].join(" ")}
      >
        <main
          aria-label={
            compactContent
              ? "Knowledge learning workspace"
              : "Knowledge production canvas"
          }
          className="min-w-0"
        >
          {spatialCanvas}
        </main>

        {(hasActivityRail || hasInspector) && (
          <section
            className={[
              "grid gap-6",
              hasInspector
                ? "lg:grid-cols-[minmax(0,1fr)_360px]"
                : "grid-cols-1",
            ].join(" ")}
          >
            {hasActivityRail && (
              <section
                aria-label="Knowledge production activity"
              >
                {activityRail}
              </section>
            )}

            {hasInspector && (
              <aside
                aria-label="Knowledge inspector"
              >
                {inspectorDock}
              </aside>
            )}
          </section>
        )}
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
