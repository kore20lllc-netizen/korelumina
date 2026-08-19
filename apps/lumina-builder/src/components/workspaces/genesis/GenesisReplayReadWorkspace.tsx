import {
  Activity,
  ArrowLeft,
  Database,
  Link2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaWorkspaceHero,
  LuminaWorkspaceLayout,
  LuminaWorkspacePanel,
} from "@/components/lumina/workspace";

import {
  useGenesisReplayRead,
} from "@/hooks/useGenesisReplayRead";

export interface GenesisReplayReadWorkspaceProps {
  onBack?:
    () => void;
}

function Metric({
  label,
  value,
  detail,
}: {
  label:
    string;

  value:
    string;

  detail:
    string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border px-5 py-4",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-compact)]",
        "[box-shadow:var(--lumina-shadow-panel)]",
      ].join(
        " ",
      )}
    >
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
        {value}
      </div>

      <div className="mt-1 text-xs text-muted-foreground">
        {detail}
      </div>
    </div>
  );
}

function InventoryState({
  loaded,
  loading,
  empty,
  onRefresh,
}: {
  loaded:
    boolean;

  loading:
    boolean;

  empty:
    boolean;

  onRefresh:
    () => void;
}) {
  if (
    loading
  ) {
    return (
      <div className="flex min-h-[280px] items-center justify-center px-6 text-sm text-muted-foreground">
        Reading persisted Genesis replay inventory…
      </div>
    );
  }

  if (
    !loaded
  ) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-5 px-8 text-center">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl border",
            "[border-color:var(--lumina-border-standard)]",
            "[background:var(--lumina-surface-interactive)]",
          ].join(
            " ",
          )}
        >
          <Database className="h-5 w-5" />
        </div>

        <div className="max-w-md">
          <div className="text-base font-semibold">
            Replay inventory has not been loaded
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Genesis replay reads are explicit. Load the persisted inventory when you want to inspect historical replay state.
          </p>
        </div>

        <LuminaButton
          variant="toolbar"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          Load replay inventory
        </LuminaButton>
      </div>
    );
  }

  if (
    empty
  ) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center px-8 text-center">
        <Database className="h-6 w-6 text-muted-foreground" />

        <div className="mt-4 text-base font-semibold">
          No persisted Genesis replays
        </div>

        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          The certified runtime inventory returned no persisted replay records.
        </p>
      </div>
    );
  }

  return null;
}

export function GenesisReplayReadWorkspace({
  onBack,
}: GenesisReplayReadWorkspaceProps) {
  const {
    snapshot,
    refreshInventory,
    selectReplay,
    refreshSelected,
    clearSelection,
    clearError,
  } =
    useGenesisReplayRead();

  const {
    inventoryLoading,
    inventoryLoaded,
    inventoryEmpty,
    inventoryCount,
    rows,
    selectionLoading,
    selectedReplayId,
    selected,
    error,
  } =
    snapshot;

  const completed =
    rows.filter(
      (
        row,
      ) =>
        row.lifecycle ===
        "Completed",
    ).length;

  const recoveryEligible =
    rows.filter(
      (
        row,
      ) =>
        row.recovery.eligible,
    ).length;

  const linkageIssues =
    rows.filter(
      (
        row,
      ) =>
        row.linkage.health ===
          "partial" ||
        row.linkage.health ===
          "ambiguous",
    ).length;

  return (
    <LuminaWorkspaceLayout
      header={
        <LuminaWorkspaceHero
          eyebrow="Historical Replay"
          title="Genesis Replay Observatory"
          subtitle="Read-only inspection of persisted Genesis replay inventory, execution progress, recovery eligibility, and Knowledge Manufacturing linkage."
          actions={
            <div className="flex flex-wrap items-center justify-end gap-3">
              {onBack && (
                <LuminaButton
                  variant="ghost"
                  onClick={onBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </LuminaButton>
              )}

              <LuminaButton
                variant="toolbar"
                disabled={
                  inventoryLoading
                }
                onClick={() => {
                  void refreshInventory();
                }}
              >
                <RefreshCw
                  className={[
                    "h-4 w-4",
                    inventoryLoading
                      ? "animate-spin"
                      : "",
                  ].join(
                    " ",
                  )}
                />

                {inventoryLoaded
                  ? "Refresh inventory"
                  : "Load inventory"}
              </LuminaButton>
            </div>
          }
        />
      }
      metrics={
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Persisted replays"
            value={
              inventoryLoaded
                ? String(
                    inventoryCount,
                  )
                : "—"
            }
            detail="Certified inventory records"
          />

          <Metric
            label="Completed"
            value={
              inventoryLoaded
                ? String(
                    completed,
                  )
                : "—"
            }
            detail="Execution lifecycle complete"
          />

          <Metric
            label="Recovery eligible"
            value={
              inventoryLoaded
                ? String(
                    recoveryEligible,
                  )
                : "—"
            }
            detail="Inspection only — no mutation"
          />

          <Metric
            label="Linkage issues"
            value={
              inventoryLoaded
                ? String(
                    linkageIssues,
                  )
                : "—"
            }
            detail="Partial or ambiguous linkage"
          />
        </div>
      }
      content={
        <div className="grid min-h-[620px] gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <LuminaWorkspacePanel
            title="Replay inventory"
            subtitle="Deterministic persisted replay identities from the certified Genesis inventory endpoint."
            toolbar={
              inventoryLoaded
                ? (
                    <span className="text-xs text-muted-foreground">
                      {inventoryCount} replay{
                        inventoryCount ===
                          1
                          ? ""
                          : "s"
                      }
                    </span>
                  )
                : undefined
            }
          >
            <InventoryState
              loaded={
                inventoryLoaded
              }
              loading={
                inventoryLoading
              }
              empty={
                inventoryEmpty
              }
              onRefresh={() => {
                void refreshInventory();
              }}
            />

            {inventoryLoaded &&
              !inventoryLoading &&
              !inventoryEmpty && (
                <div className="h-full overflow-y-auto p-4">
                  <div className="space-y-3">
                    {rows.map(
                      (
                        row,
                      ) => (
                        <button
                          key={
                            row.replayId
                          }
                          type="button"
                          onClick={() => {
                            void selectReplay(
                              row.replayId,
                            );
                          }}
                          className={[
                            "w-full rounded-2xl border p-4 text-left transition",
                            "hover:-translate-y-[1px]",
                            "hover:[border-color:var(--lumina-border-emphasis)]",
                            row.selected
                              ? "[border-color:var(--lumina-border-emphasis)] [background:var(--lumina-surface-selected)]"
                              : "[border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)]",
                          ].join(
                            " ",
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-mono text-sm font-medium text-foreground">
                                {
                                  row.shortReplayId
                                }
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>
                                  {
                                    row.lifecycle
                                  }
                                </span>

                                <span>
                                  •
                                </span>

                                <span>
                                  {
                                    row.manifestReadiness
                                  }
                                </span>

                                <span>
                                  •
                                </span>

                                <span>
                                  {
                                    row.manifestSources
                                  } source{
                                    row.manifestSources ===
                                      1
                                      ? ""
                                      : "s"
                                  }
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                {
                                  row.progress
                                    .available
                                    ? `${row.progress.percent}%`
                                    : "—"
                                }
                              </div>

                              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                progress
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {
                                row.recovery
                                  .label
                              }
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Link2 className="h-3.5 w-3.5" />
                              {
                                row.linkage
                                  .label
                              }
                            </div>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
          </LuminaWorkspacePanel>

          <LuminaWorkspacePanel
            title="Replay inspection"
            subtitle="Certified per-replay status projection. No replay execution controls are exposed."
            toolbar={
              selectedReplayId
                ? (
                    <LuminaButton
                      variant="subtle"
                      size="sm"
                      disabled={
                        selectionLoading
                      }
                      onClick={() => {
                        void refreshSelected();
                      }}
                    >
                      <RefreshCw
                        className={[
                          "h-3.5 w-3.5",
                          selectionLoading
                            ? "animate-spin"
                            : "",
                        ].join(
                          " ",
                        )}
                      />

                      Refresh
                    </LuminaButton>
                  )
                : undefined
            }
          >
            {!selectedReplayId && (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-8 text-center">
                <Activity className="h-6 w-6 text-muted-foreground" />

                <div className="mt-4 text-base font-semibold">
                  Select a replay
                </div>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Choose a persisted Replay Identity to inspect its certified execution, recovery, and linkage state.
                </p>
              </div>
            )}

            {selectedReplayId &&
              selectionLoading &&
              !selected && (
                <div className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground">
                  Reading replay status…
                </div>
              )}

            {selected && (
              <div className="h-full overflow-y-auto p-5">
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Replay Identity
                    </div>

                    <div className="mt-2 break-all font-mono text-sm">
                      {
                        selected.replayId
                      }
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <Metric
                      label="Lifecycle"
                      value={
                        selected.lifecycle
                      }
                      detail={
                        selected.manifestReadiness
                      }
                    />

                    <Metric
                      label="Progress"
                      value={
                        selected.progress
                          .available
                          ? `${selected.progress.percent}%`
                          : "—"
                      }
                      detail={
                        selected.progress
                          .available
                          ? `${selected.progress.completed} of ${selected.progress.total} complete`
                          : "No execution progress"
                      }
                    />

                    <Metric
                      label="Recovery"
                      value={
                        selected.recovery
                          .eligible
                          ? "Eligible"
                          : "No"
                      }
                      detail={
                        selected.recovery
                          .label
                      }
                    />

                    <Metric
                      label="Linkage"
                      value={
                        selected.linkage
                          .health
                      }
                      detail={
                        selected.linkage
                          .label
                      }
                    />
                  </div>

                  {selected.currentHistoricalSourceId && (
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        Current historical source
                      </div>

                      <div className="mt-2 break-all font-mono text-xs leading-5 text-foreground">
                        {
                          selected.currentHistoricalSourceId
                        }
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <LuminaButton
                      variant="ghost"
                      size="sm"
                      onClick={
                        clearSelection
                      }
                    >
                      Clear selection
                    </LuminaButton>
                  </div>
                </div>
              </div>
            )}
          </LuminaWorkspacePanel>
        </div>
      }
      inspector={
        error
          ? (
              <LuminaWorkspacePanel
                title="Read integrity"
                subtitle="The certified read stack returned an error."
              >
                <div className="space-y-4 p-5">
                  <div
                    className={[
                      "rounded-2xl border p-4",
                      "border-red-400/25",
                      "bg-red-500/[0.06]",
                    ].join(
                      " ",
                    )}
                  >
                    <div className="text-sm font-semibold text-red-200">
                      {
                        error.label
                      }
                    </div>

                    <div className="mt-2 font-mono text-xs text-red-200/80">
                      {
                        error.code ??
                        error.message
                      }
                    </div>

                    {error.status !==
                      null && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        HTTP {
                          error.status
                        }
                      </div>
                    )}
                  </div>

                  <LuminaButton
                    variant="ghost"
                    size="sm"
                    onClick={
                      clearError
                    }
                  >
                    Clear error
                  </LuminaButton>
                </div>
              </LuminaWorkspacePanel>
            )
          : undefined
      }
    />
  );
}

export default GenesisReplayReadWorkspace;
