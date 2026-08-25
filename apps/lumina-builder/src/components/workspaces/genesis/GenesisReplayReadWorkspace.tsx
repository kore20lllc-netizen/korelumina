import {
  useCallback,
  useState,
} from "react";

import {
  Activity,
  ArrowLeft,
  Clock3,
  Database,
  GitBranch,
  Link2,
  Network,
  RefreshCw,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaWorkspaceLayout,
} from "@/components/lumina/workspace";

import {
  LuminaExecutiveTitleMetricsComposition,
} from "@/components/design-system/compositions/LuminaExecutiveTitleMetricsComposition";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  LuminaSectionNavigator,
} from "@/components/lumina/workspace/primitives/LuminaSectionNavigator";

import {
  useGenesisOperationalRead,
} from "@/hooks/useGenesisOperationalRead";

import {
  GenesisOperationalProjectionPanel,
} from "./GenesisOperationalProjectionPanel";

import {
  GenesisDayZeroCertificationPanel,
} from "./GenesisDayZeroCertificationPanel";

import {
  GenesisConversationHistoryCandidateReviewPanel,
} from "./GenesisConversationHistoryCandidateReviewPanel";

import {
  GenesisConversationAuthoritativeCompletenessCertificationPanel,
} from "./GenesisConversationAuthoritativeCompletenessCertificationPanel";

import {
  GenesisHistoricalArtifactExplorer,
} from "./GenesisHistoricalArtifactExplorer";

import {
  GenesisEvolutionEpisodeInspector,
} from "./GenesisEvolutionEpisodeInspector";

import {
  GenesisTemporalChronologyInspector,
} from "./GenesisTemporalChronologyInspector";

import {
  GenesisHistoricalRelationshipInspector,
} from "./GenesisHistoricalRelationshipInspector";

import {
  useGenesisHistoricalNavigation,
} from "./GenesisHistoricalNavigation";

import type {
  GenesisHistoricalArtifactNavigationTarget,
} from "./GenesisHistoricalNavigation";

const GENESIS_SECTIONS = [
  {
    id:
      "genesis-replay-inventory",
    label:
      "Replay Inventory",
    icon:
      Database,
  },
  {
    id:
      "genesis-replay-inspection",
    label:
      "Replay Inspection",
    icon:
      Activity,
  },
  {
    id:
      "genesis-temporal-chronology",
    label:
      "Temporal Chronology",
    icon:
      Clock3,
  },
  {
    id:
      "genesis-historical-relationships",
    label:
      "Relationships",
    icon:
      Network,
  },
  {
    id:
      "genesis-evolution-episodes",
    label:
      "Evolution Episodes",
    icon:
      GitBranch,
  },
  {
    id:
      "genesis-historical-artifacts",
    label:
      "Historical Artifacts",
    icon:
      GitBranch,
  },
  {
    id:
      "genesis-operational-reconstruction",
    label:
      "Reconstruction",
    icon:
      ShieldCheck,
  },
  {
    id:
      "genesis-conversation-history-candidate-review",
    label:
      "Candidate Review",
    icon:
      ShieldCheck,
  },
  {
    id:
      "genesis-authoritative-completeness-certification",
    label:
      "Completeness Certification",
    icon:
      BadgeCheck,
  },
  {
    id:
      "genesis-day-zero-certification",
    label:
      "Day-0 Certification",
    icon:
      BadgeCheck,
  },
] as const;

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
    <LuminaFlagshipCard
      as="article"
      className="min-w-0 px-5 py-4"
    >
      <div className="relative z-10">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/72">
          {label}
        </div>

        <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-amber-400">
          {value}
        </div>

        <div className="mt-1 text-xs leading-5 text-sky-300/58">
          {detail}
        </div>
      </div>
    </LuminaFlagshipCard>
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
    useGenesisOperationalRead();

  const {
    replay,
    operational,
  } =
    snapshot;

  const {
    state: peerNavigation,
    navigateToChronology,
    navigateToRelationship,
    navigateToEpisode,
  } =
    useGenesisHistoricalNavigation();


  const [
    artifactNavigationTarget,
    setArtifactNavigationTarget,
  ] =
    useState<
      GenesisHistoricalArtifactNavigationTarget |
      null
    >(
      null,
    );

  const navigateToHistoricalArtifact =
    useCallback(
      (
        target:
          Omit<
            GenesisHistoricalArtifactNavigationTarget,
            "requestId"
          >,
      ) => {
        setArtifactNavigationTarget(
          previous => ({
            ...target,

            requestId:
              (previous?.requestId ?? 0) +
              1,
          }),
        );

        requestAnimationFrame(
          () => {
            const targetElement =
              document.getElementById(
                "genesis-historical-artifacts",
              );

            if (
              !targetElement
            ) {
              return;
            }

            const reduceMotion =
              window.matchMedia(
                "(prefers-reduced-motion: reduce)",
              ).matches;

            targetElement.scrollIntoView({
              behavior:
                reduceMotion
                  ? "auto"
                  : "smooth",

              block:
                "start",
            });
          },
        );
      },
      [],
    );

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
    replay;

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
        <LuminaExecutiveTitleMetricsComposition
          variant="balanced"
          titleRegion={
            <LuminaFlagshipPanel
              title={null}
              className="h-full [&>div:nth-of-type(3)]:hidden"
            >
              <div
                id="genesis-replay-observatory-top"
                className="relative z-10 min-w-0 scroll-mt-28 px-6 pb-6 pt-2"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan">
                  Historical Replay
                </div>

                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-cyan">
                  Genesis Replay Observatory
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
                  Read-only inspection of persisted Genesis replay inventory,
                  execution progress, recovery eligibility, Knowledge
                  Manufacturing linkage, and governed institutional
                  reconstruction.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
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
                    disabled={inventoryLoading}
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
                      ].join(" ")}
                    />

                    {inventoryLoaded
                      ? "Refresh inventory"
                      : "Load inventory"}
                  </LuminaButton>
                </div>
              </div>
            </LuminaFlagshipPanel>
          }
          metricsRegion={
            <LuminaFlagshipPanel
              title={null}
              className="h-full [&>div:nth-of-type(3)]:hidden"
            >
              <div className="relative z-10 grid gap-3 p-4 sm:grid-cols-2">
                <Metric
                  label="Persisted replays"
                  value={
                    inventoryLoaded
                      ? String(inventoryCount)
                      : "—"
                  }
                  detail="Certified inventory records"
                />

                <Metric
                  label="Completed"
                  value={
                    inventoryLoaded
                      ? String(completed)
                      : "—"
                  }
                  detail="Execution lifecycle complete"
                />

                <Metric
                  label="Recovery eligible"
                  value={
                    inventoryLoaded
                      ? String(recoveryEligible)
                      : "—"
                  }
                  detail="Inspection only — no mutation"
                />

                <Metric
                  label="Linkage issues"
                  value={
                    inventoryLoaded
                      ? String(linkageIssues)
                      : "—"
                  }
                  detail="Partial or ambiguous linkage"
                />
              </div>
            </LuminaFlagshipPanel>
          }
        />
      }
      metrics={null}
      toolbar={
        <LuminaSectionNavigator
          items={GENESIS_SECTIONS}
          ariaLabel="Genesis replay observatory sections"
          topTargetId="genesis-replay-observatory-top"
          minWidthClassName="min-w-[1600px]"
          gridColumnsClassName="grid-cols-10"
        />
      }
      content={
        <div className="grid min-w-0 gap-6">
          <section
            id="genesis-replay-inventory"
            className="min-w-0 scroll-mt-28"
          >
            <LuminaFlagshipPanel
              title="Replay inventory"
            description="Deterministic persisted replay identities from the certified Genesis inventory endpoint."
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
                <div className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain p-4 [scrollbar-gutter:stable] [touch-action:pan-y]">
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
            </LuminaFlagshipPanel>
          </section>

          <section
            id="genesis-replay-inspection"
            className="min-w-0 scroll-mt-28"
          >
            <LuminaFlagshipPanel
              title="Replay inspection"
            description="Certified per-replay status projection. No replay execution controls are exposed."
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
              <div className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain p-5 [scrollbar-gutter:stable] [touch-action:pan-y]">
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
            </LuminaFlagshipPanel>
          </section>
          {error && (
                  <LuminaFlagshipPanel
                    title="Read integrity"
                    description="The certified replay read stack returned an error."
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
                  </LuminaFlagshipPanel>
                )}

                <section
                  id="genesis-temporal-chronology"
                  className="min-w-0 scroll-mt-28"
                >
                  {operational.projection ? (
                    <GenesisTemporalChronologyInspector
                      projection={
                        operational.projection
                      }
                      navigationTarget={
                        peerNavigation.chronology
                      }
                      onNavigateToArtifact={
                        navigateToHistoricalArtifact
                      }
                    />
                  ) : (
                    <LuminaFlagshipPanel
                      title="Temporal chronology"
                      description="Deterministic historical ordering from the selected Genesis Replay."
                    >
                      <div className="flex min-h-[320px] items-center justify-center px-8 text-center text-sm text-muted-foreground">
                        Select a persisted Replay to inspect its Temporal Chronology.
                      </div>
                    </LuminaFlagshipPanel>
                  )}
                </section>

                <section
                  id="genesis-historical-relationships"
                  className="min-w-0 scroll-mt-28"
                >
                  {operational.projection ? (
                    <GenesisHistoricalRelationshipInspector
                      projection={
                        operational.projection
                      }
                      navigationTarget={
                        peerNavigation.relationship
                      }
                      onNavigateToArtifact={
                        navigateToHistoricalArtifact
                      }
                    />
                  ) : (
                    <LuminaFlagshipPanel
                      title="Historical relationships"
                      description="Runtime-governed historical correlations and exact Source/Event endpoints."
                    >
                      <div className="flex min-h-[320px] items-center justify-center px-8 text-center text-sm text-muted-foreground">
                        Select a persisted Replay to inspect Historical Relationships.
                      </div>
                    </LuminaFlagshipPanel>
                  )}
                </section>

                <section
                  id="genesis-evolution-episodes"
                  className="min-w-0 scroll-mt-28"
                >
                  {operational.projection ? (
                    <GenesisEvolutionEpisodeInspector
                      projection={
                        operational.projection
                      }
                      navigationTarget={
                        peerNavigation.episode
                      }
                      onNavigateToArtifact={
                        navigateToHistoricalArtifact
                      }
                    />
                  ) : (
                    <LuminaFlagshipPanel
                      title="Evolution episodes"
                      description="Governed evolution groups materialized only from sufficient Runtime semantic evidence."
                    >
                      <div className="flex min-h-[320px] items-center justify-center px-8 text-center text-sm text-muted-foreground">
                        Select a persisted Replay to inspect Evolution Episodes.
                      </div>
                    </LuminaFlagshipPanel>
                  )}
                </section>

                <section
                  id="genesis-historical-artifacts"
                  className="min-w-0 scroll-mt-28"
                >
                  {operational.projection ? (
                    <GenesisHistoricalArtifactExplorer
                      projection={
                        operational.projection
                      }
                      navigationTarget={
                        artifactNavigationTarget
                      }
                      onNavigateToChronology={
                        navigateToChronology
                      }
                      onNavigateToRelationship={
                        navigateToRelationship
                      }
                      onNavigateToEpisode={
                        navigateToEpisode
                      }
                    />
                  ) : (
                    <LuminaFlagshipPanel
                      title="Historical artifacts"
                      description="Provenance-preserving Sources, Historical Events, and governed Evolution Episodes."
                    >
                      <div className="flex min-h-[320px] items-center justify-center px-8 text-center text-sm text-muted-foreground">
                        Select a persisted Replay to inspect Historical Artifacts.
                      </div>
                    </LuminaFlagshipPanel>
                  )}
                </section>

                <section
                  id="genesis-operational-reconstruction"
                  className="min-w-0 scroll-mt-28"
                >
                  <GenesisOperationalProjectionPanel
                    state={
                      operational
                    }
                  />
                </section>

                <section
                  id="genesis-conversation-history-candidate-review"
                  className="min-w-0 scroll-mt-28"
                >
                  <GenesisConversationHistoryCandidateReviewPanel />
                </section>

                <section
                  id="genesis-authoritative-completeness-certification"
                  className="min-w-0 scroll-mt-28"
                >
                  <GenesisConversationAuthoritativeCompletenessCertificationPanel />
                </section>

                <section
                  id="genesis-day-zero-certification"
                  className="min-w-0 scroll-mt-28"
                >
                  <GenesisDayZeroCertificationPanel />
                </section>
        </div>
      }
    />
  );
}

export default GenesisReplayReadWorkspace;
