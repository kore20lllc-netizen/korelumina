import {
  AlertTriangle,
  BookOpenCheck,
  GitBranch,
  History,
  MessagesSquare,
  Network,
  ShieldCheck,
} from "lucide-react";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import type {
  GenesisOperationalReadState,
} from "@/services/runtime/genesisReplayRead";

export interface GenesisOperationalProjectionPanelProps {
  state:
    GenesisOperationalReadState;
}

function OperationalMetric({
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
      className="min-w-0 px-4 py-4"
    >
      <div className="relative z-10">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>

      <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
        {value}
      </div>

      <div className="mt-1 text-xs leading-5 text-sky-300/58">
        {detail}
      </div>
      </div>
    </LuminaFlagshipCard>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon:
    React.ReactNode;

  title:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <LuminaFlagshipCard
      as="article"
      className="p-4"
    >
      <div className="relative z-10">
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">
          {icon}
        </div>

        <div className="text-sm font-semibold text-foreground">
          {title}
        </div>
      </div>

      <div className="mt-4">
        {children}
      </div>
      </div>
    </LuminaFlagshipCard>
  );
}

function ReadinessTone({
  state,
}: {
  state:
    string;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em]",
        state === "ready"
          ? "border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-200"
          : state === "blocked"
            ? "border-red-400/25 bg-red-500/[0.08] text-red-200"
            : "border-amber-400/25 bg-amber-500/[0.08] text-amber-200",
      ].join(
        " ",
      )}
    >
      {state}
    </span>
  );
}

export function GenesisOperationalProjectionPanel({
  state,
}: GenesisOperationalProjectionPanelProps) {
  if (
    state.replayId ===
      null
  ) {
    return (
      <LuminaFlagshipPanel
        title="Operational reconstruction"
        description="Replay-scoped Genesis Corpus, chronology, governance, Knowledge lifecycle, readiness, and external-source state."
      >
        <div className="flex min-h-[320px] flex-col items-center justify-center px-8 text-center">
          <ShieldCheck className="h-6 w-6 text-muted-foreground" />

          <div className="mt-4 text-base font-semibold text-foreground">
            Select a replay
          </div>

          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Select a persisted Genesis Replay to inspect its operational
            reconstruction, corpus state, governance, Knowledge lifecycle,
            and readiness.
          </p>

          <p className="mt-3 max-w-lg text-xs leading-5 text-sky-300/58">
            Day-0 Certification is a separate corpus-level authority and may
            remain visible without a replay being selected for inspection.
          </p>
        </div>
      </LuminaFlagshipPanel>
    );
  }

  if (
    state.loading &&
    state.projection ===
      null
  ) {
    return (
      <LuminaFlagshipPanel
        title="Operational reconstruction"
        description="Reading the certified Genesis operational projection for the selected replay."
      >
        <div className="flex min-h-[180px] items-center justify-center px-6 text-sm text-muted-foreground">
          Reading Genesis Corpus, chronology, governance, and Knowledge lifecycle…
        </div>
      </LuminaFlagshipPanel>
    );
  }

  if (
    state.error &&
    state.projection ===
      null
  ) {
    return (
      <LuminaFlagshipPanel
        title="Operational integrity"
        description="The replay-scoped operational projection could not be read."
      >
        <div className="p-5">
          <div
            className={[
              "rounded-2xl border p-4",
              "border-red-400/25",
              "bg-red-500/[0.06]",
            ].join(
              " ",
            )}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Operational projection unavailable
            </div>

            <div className="mt-2 font-mono text-xs leading-5 text-red-200/80">
              {
                state.error.code ??
                state.error.message
              }
            </div>

            {state.error.status !==
              null && (
              <div className="mt-2 text-xs text-muted-foreground">
                HTTP {
                  state.error.status
                }
              </div>
            )}
          </div>
        </div>
      </LuminaFlagshipPanel>
    );
  }

  const projection =
    state.projection;

  if (
    projection ===
      null
  ) {
    return null;
  }

  const {
    corpus,
    chronology,
    documentationGovernance,
    knowledgeLifecycle,
    readiness,
    conversationSource,
  } =
    projection;

  const missingSources =
    readiness.sources
      .missingRequiredSourceClasses;

  const chronologyGaps =
    readiness.chronology
      .sourceRevisionsWithoutHistoricalEvents +
    readiness.chronology
      .unresolvedRelationships +
    readiness.chronology
      .conflictedEpisodes;

  const governanceGaps =
    readiness.authority
      .unresolved +
    readiness.authority
      .missingScope +
    readiness.authority
      .missingEffectivePeriod;

  return (
    <LuminaFlagshipPanel
      title="Operational reconstruction"
      description="Replay-scoped Genesis Corpus, chronology, governance, Knowledge lifecycle, readiness, and external-source state."
      toolbar={
        <ReadinessTone
          state={
            readiness.overall
          }
        />
      }
    >
      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OperationalMetric
            label="Source revisions"
            value={String(
              corpus.sourceSummary
                .sourceRevisions,
            )}
            detail={`${corpus.sourceSummary.uniqueSources} deterministic source identities`}
          />

          <OperationalMetric
            label="Historical events"
            value={String(
              chronology.coverage
                .totalEvents,
            )}
            detail={
              chronology.coverage
                .complete
                ? "Chronology coverage complete"
                : `${chronologyGaps} chronology gap${chronologyGaps === 1 ? "" : "s"}`
            }
          />

          <OperationalMetric
            label="Evolution episodes"
            value={String(
              corpus.evolutionSummary
                .evolutionEpisodes,
            )}
            detail={`${corpus.evolutionSummary.validatedEpisodes} validated · ${corpus.evolutionSummary.conflictedEpisodes} conflicted`}
          />

          <OperationalMetric
            label="Canonical"
            value={String(
              knowledgeLifecycle
                .summary
                .canonical,
            )}
            detail={`${knowledgeLifecycle.summary.packaged} packaged · ${knowledgeLifecycle.summary.awaitingCanonicalReview} awaiting review`}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Section
            icon={
              <History className="h-4 w-4" />
            }
            title="Historical reconstruction"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <OperationalMetric
                label="Relationships"
                value={String(
                  corpus.evolutionSummary
                    .relationships,
                )}
                detail={`${corpus.evolutionSummary.unresolvedRelationships} unresolved`}
              />

              <OperationalMetric
                label="External context"
                value={String(
                  corpus.externalContext
                    .pendingEpisodes,
                )}
                detail={
                  corpus.externalContext
                    .complete
                    ? "External context complete"
                    : "EXTERNAL CONTEXT PENDING"
                }
              />
            </div>
          </Section>

          <Section
            icon={
              <ShieldCheck className="h-4 w-4" />
            }
            title="Documentation governance"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <OperationalMetric
                label="Governed documents"
                value={String(
                  documentationGovernance
                    .summary
                    .documents,
                )}
                detail={`${documentationGovernance.summary.governing} governing`}
              />

              <OperationalMetric
                label="Authority gaps"
                value={String(
                  governanceGaps,
                )}
                detail={`${documentationGovernance.summary.superseded} superseded documents retained`}
              />
            </div>
          </Section>

          <Section
            icon={
              <Network className="h-4 w-4" />
            }
            title="Knowledge Operations lifecycle"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <OperationalMetric
                label="Evidence admitted"
                value={String(
                  knowledgeLifecycle
                    .summary
                    .admittedEvidence,
                )}
                detail={`${knowledgeLifecycle.summary.manufacturingCorrelated} manufacturing correlations`}
              />

              <OperationalMetric
                label="Memory adapted"
                value={String(
                  knowledgeLifecycle
                    .summary
                    .memoryAdaptationValidated,
                )}
                detail={`${knowledgeLifecycle.summary.memoryCorrelatedCanonicalItems} canonical memory correlations`}
              />
            </div>
          </Section>

          <Section
            icon={
              <MessagesSquare className="h-4 w-4" />
            }
            title="Historical conversations"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Source capability
                  </div>

                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {
                      conversationSource
                        .classification
                    }
                  </div>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  {
                    conversationSource
                      .externalSourceMarker
                  }
                </div>
              </div>

              {conversationSource
                .acquisition
                .blocker && (
                <div className="text-xs leading-5 text-muted-foreground">
                  {
                    conversationSource
                      .acquisition
                      .blocker
                  }
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" />
                Repository replay remains available; Git does not substitute for Conversation Evidence.
              </div>
            </div>
          </Section>
        </div>

        <Section
          icon={
            <BookOpenCheck className="h-4 w-4" />
          }
          title="Genesis readiness"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OperationalMetric
              label="Readiness"
              value={
                readiness.overall
              }
              detail={`${readiness.blockers.length} blocker${readiness.blockers.length === 1 ? "" : "s"}`}
            />

            <OperationalMetric
              label="Required sources missing"
              value={String(
                missingSources.length,
              )}
              detail={
                missingSources.length >
                  0
                  ? missingSources.join(
                      ", ",
                    )
                  : "All policy-required source classes present"
              }
            />

            <OperationalMetric
              label="Replay coverage"
              value={
                readiness.replay
                  .sourcesReplayed ===
                null
                  ? "Unavailable"
                  : String(
                      readiness.replay
                        .sourcesReplayed,
                    )
              }
              detail="Exact source replay count is not inferred"
            />

            <OperationalMetric
              label="Educational eligibility"
              value={
                readiness.education
                  .state
              }
              detail={
                readiness.education
                  .reason
              }
            />
          </div>
        </Section>

        <div className="break-all font-mono text-[10px] leading-4 text-muted-foreground">
          Operational projection: {
            projection.projectionId
          }
        </div>
      </div>
    </LuminaFlagshipPanel>
  );
}

export default GenesisOperationalProjectionPanel;
