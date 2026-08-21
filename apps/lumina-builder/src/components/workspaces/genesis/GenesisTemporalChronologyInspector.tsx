import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDown,
  ArrowUp,
  Clock3,
  GitBranch,
  Link2,
  ShieldCheck,
} from "lucide-react";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import type {
  GenesisTemporalChronologyNavigationTarget,
} from "./GenesisHistoricalNavigation";

import type {
  GenesisHistoricalRelationshipRecord,
  GenesisOperationalProjection,
  GenesisTemporalChronologyEntry,
} from "@/services/runtime/genesisReplayRead";

import type {
  GenesisHistoricalArtifactNavigationTarget,
} from "./GenesisHistoricalNavigation";

export interface GenesisTemporalChronologyInspectorProps {
  projection:
    GenesisOperationalProjection;

  navigationTarget?:
    GenesisTemporalChronologyNavigationTarget;

  onNavigateToArtifact?(
    target:
      Omit<
        GenesisHistoricalArtifactNavigationTarget,
        "requestId"
      >,
  ): void;
}

function formatTimestamp(
  value:
    number,
): string {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return String(
      value,
    );
  }

  return date.toLocaleString();
}

function Badge({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span
      className="
        inline-flex min-h-6 items-center rounded-full
        border border-cyan-300/18 bg-cyan-300/[0.055]
        px-2.5 py-1 text-[9px] font-semibold uppercase
        tracking-[0.12em] text-cyan-100/78
      "
    >
      {children}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-300/52">
        {label}
      </div>

      <div className="mt-1 break-words text-xs leading-5 text-white/72 [overflow-wrap:anywhere]">
        {children}
      </div>
    </div>
  );
}

function RelationshipCard({
  relationship,
  direction,
}: {
  relationship:
    GenesisHistoricalRelationshipRecord;

  direction:
    "incoming" |
    "outgoing";
}) {
  return (
    <LuminaFlagshipCard
      as="article"
      className="min-w-0 rounded-[16px] p-3"
    >
      <div className="relative z-10 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>
            {direction}
          </Badge>

          <Badge>
            {relationship.type}
          </Badge>

          <Badge>
            {relationship.confidence}
          </Badge>

          {relationship.causal && (
            <Badge>
              explicit causal relation
            </Badge>
          )}
        </div>

        <div className="mt-3 break-all font-mono text-[10px] leading-5 text-white/46">
          {relationship.relationshipId}
        </div>

        <div className="mt-2 text-[10px] leading-5 text-sky-300/52">
          Evidence-backed Runtime relationship. Chronological adjacency alone is not treated as causality.
        </div>
      </div>
    </LuminaFlagshipCard>
  );
}

function ChronologyEntryCard({
  entry,
  selected,
  onClick,
}: {
  entry:
    GenesisTemporalChronologyEntry;

  selected:
    boolean;

  onClick:
    () => void;
}) {
  return (
    <LuminaFlagshipCard
      as="button"
      interactive
      selected={
        selected
      }
      onClick={
        onClick
      }
      className="w-full min-w-0 p-4 text-left"
    >
      <div className="relative z-10 min-w-0">
        <div className="flex items-start gap-3">
          <div
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-xl border border-cyan-300/18
              bg-cyan-300/[0.055]
              font-mono text-[11px] font-semibold text-cyan-100
            "
          >
            {entry.position}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>
                {entry.kind}
              </Badge>

              <Badge>
                {entry.temporalAuthority.historical.status}
              </Badge>
            </div>

            <div className="mt-3 break-words text-sm font-semibold leading-5 text-white/88 [overflow-wrap:anywhere]">
              {entry.summary ??
                "Historical event without summary"}
            </div>

            <div className="mt-2 text-[11px] text-amber-200/66">
              {formatTimestamp(
                entry.occurredAt,
              )}
            </div>

            <div className="mt-2 truncate font-mono text-[10px] text-white/40">
              {entry.eventId}
            </div>
          </div>
        </div>
      </div>
    </LuminaFlagshipCard>
  );
}

export function GenesisTemporalChronologyInspector({
  projection,
  onNavigateToArtifact,
  navigationTarget,
}: GenesisTemporalChronologyInspectorProps) {
  const chronology =
    projection.chronology;

  const relationships =
    projection.corpus
      .relationships;

  const [selectedEntryId, setSelectedEntryId] =
    useState<string | null>(
      null,
    );


  useEffect(
    () => {
      if (
        !navigationTarget
      ) {
        return;
      }

      const entry =
        chronology.entries.find(
          candidate =>
            candidate.eventId ===
            navigationTarget.eventId,
        );

      if (
        entry
      ) {
        setSelectedEntryId(
          entry.chronologyEntryId,
        );
      }
    },
    [
      chronology.entries,
      navigationTarget,
    ],
  );

  const selectedEntry =
    useMemo(
      () =>
        selectedEntryId
          ? chronology.entries.find(
              (
                entry,
              ) =>
                entry.chronologyEntryId ===
                selectedEntryId,
            ) ??
            null
          : null,
      [
        chronology.entries,
        selectedEntryId,
      ],
    );

  const selectedRelationships =
    useMemo(
      () => {
        if (
          !selectedEntry
        ) {
          return {
            incoming:
              [] as GenesisHistoricalRelationshipRecord[],

            outgoing:
              [] as GenesisHistoricalRelationshipRecord[],
          };
        }

        const byId =
          new Map(
            relationships.map(
              (
                relationship,
              ) => [
                relationship.relationshipId,
                relationship,
              ],
            ),
          );

        return {
          incoming:
            selectedEntry
              .incomingRelationshipIds
              .map(
                id =>
                  byId.get(
                    id,
                  ),
              )
              .filter(
                (
                  value,
                ): value is GenesisHistoricalRelationshipRecord =>
                  Boolean(
                    value,
                  ),
              ),

          outgoing:
            selectedEntry
              .outgoingRelationshipIds
              .map(
                id =>
                  byId.get(
                    id,
                  ),
              )
              .filter(
                (
                  value,
                ): value is GenesisHistoricalRelationshipRecord =>
                  Boolean(
                    value,
                  ),
              ),
        };
      },
      [
        relationships,
        selectedEntry,
      ],
    );

  const coverage =
    chronology.coverage;

  const authority =
    chronology.authority;

  return (
    <LuminaFlagshipPanel
      title="Temporal chronology"
      description="Deterministic historical ordering with authority, episode membership, and evidence-backed relationship inspection. Sequence is never promoted to causality."
      toolbar={
        <div className="flex flex-wrap gap-2">
          <Badge>
            {coverage.totalEvents} events
          </Badge>

          <Badge>
            {coverage.complete
              ? "coverage complete"
              : "coverage incomplete"}
          </Badge>

          {coverage.equalTimestampGroups.length >
            0 && (
            <Badge>
              {coverage.equalTimestampGroups.length} equal-time group{
                coverage.equalTimestampGroups.length ===
                  1
                  ? ""
                  : "s"
              }
            </Badge>
          )}
        </div>
      }
    >
      <div className="relative z-10 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LuminaFlagshipCard
            as="article"
            className="p-4"
          >
            <div className="relative z-10">
              <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-300/52">
                Historically authoritative
              </div>

              <div className="mt-2 text-xl font-semibold text-amber-300">
                {authority.historicallyAuthoritative}
              </div>
            </div>
          </LuminaFlagshipCard>

          <LuminaFlagshipCard
            as="article"
            className="p-4"
          >
            <div className="relative z-10">
              <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-300/52">
                Historically validated
              </div>

              <div className="mt-2 text-xl font-semibold text-amber-300">
                {authority.historicallyValidated}
              </div>
            </div>
          </LuminaFlagshipCard>

          <LuminaFlagshipCard
            as="article"
            className="p-4"
          >
            <div className="relative z-10">
              <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-300/52">
                Currently superseded
              </div>

              <div className="mt-2 text-xl font-semibold text-amber-300">
                {authority.currentlySuperseded}
              </div>
            </div>
          </LuminaFlagshipCard>

          <LuminaFlagshipCard
            as="article"
            className="p-4"
          >
            <div className="relative z-10">
              <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-300/52">
                Unresolved relationships
              </div>

              <div className="mt-2 text-xl font-semibold text-amber-300">
                {coverage.unresolvedRelationshipIds.length}
              </div>
            </div>
          </LuminaFlagshipCard>
        </div>

        {chronology.entries.length ===
        0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-8 text-center">
            <Clock3 className="h-6 w-6 text-cyan-300/48" />

            <div className="mt-4 text-sm font-semibold text-white/78">
              No historical chronology projected
            </div>

            <p className="mt-2 max-w-md text-xs leading-5 text-white/42">
              Genesis does not invent chronology when the Runtime projection contains no Historical Events.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
            <div
              className="
                min-h-0 min-w-0 space-y-3
                overflow-y-auto overflow-x-hidden
                overscroll-contain pb-5 pr-1
                scroll-pb-5
                xl:max-h-[720px]
                [scrollbar-gutter:stable]
                [touch-action:pan-y]
              "
              aria-label="Genesis temporal chronology entries"
            >
              {chronology.entries.map(
                (
                  entry,
                ) => (
                  <ChronologyEntryCard
                    key={
                      entry.chronologyEntryId
                    }
                    entry={
                      entry
                    }
                    selected={
                      selectedEntryId ===
                      entry.chronologyEntryId
                    }
                    onClick={() => {
                      setSelectedEntryId(
                        entry.chronologyEntryId,
                      );
                    }}
                  />
                ),
              )}
            </div>

            <LuminaFlagshipCard
              as="article"
              className="min-h-[420px] min-w-0 p-5"
            >
              <div className="relative z-10 min-w-0">
                {!selectedEntry && (
                  <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">
                    <GitBranch className="h-6 w-6 text-cyan-300/48" />

                    <div className="mt-4 text-sm font-semibold text-white/78">
                      Select a chronology entry
                    </div>

                    <p className="mt-2 max-w-sm text-xs leading-5 text-white/42">
                      Inspect temporal authority, chronological neighbors, episode membership, and separately modeled historical relationships.
                    </p>
                  </div>
                )}

                {selectedEntry && (
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      <Badge>
                        position {selectedEntry.position}
                      </Badge>

                      <Badge>
                        {selectedEntry.kind}
                      </Badge>

                      <Badge>
                        {selectedEntry.temporalAuthority.current.status}
                      </Badge>
                    </div>

                    <Field label="Event identity">
                      <span className="font-mono">
                        {selectedEntry.eventId}
                      </span>
                    </Field>


                    {onNavigateToArtifact && (
                      <LuminaButton
                        type="button"
                        variant="subtle"
                        size="sm"
                        onClick={() => {
                          onNavigateToArtifact({
                            kind:
                              "event",

                            id:
                              selectedEntry.eventId,
                          });
                        }}
                      >
                        Open Event in Historical Artifacts
                      </LuminaButton>
                    )}

                    <Field label="Occurred">
                      {formatTimestamp(
                        selectedEntry.occurredAt,
                      )}
                    </Field>

                    <Field label="Historical authority">
                      {selectedEntry.temporalAuthority.historical.status}
                    </Field>

                    <Field label="Current authority">
                      {selectedEntry.temporalAuthority.current.status}
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <LuminaFlagshipCard
                        as="article"
                        className="rounded-[16px] p-3"
                      >
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/54">
                            <ArrowUp className="h-3 w-3" />
                            Chronological predecessors
                          </div>

                          <div className="mt-2 text-sm font-semibold text-white/82">
                            {selectedEntry.chronologicalPredecessorEventIds.length}
                          </div>
                        </div>
                      </LuminaFlagshipCard>

                      <LuminaFlagshipCard
                        as="article"
                        className="rounded-[16px] p-3"
                      >
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/54">
                            <ArrowDown className="h-3 w-3" />
                            Chronological successors
                          </div>

                          <div className="mt-2 text-sm font-semibold text-white/82">
                            {selectedEntry.chronologicalSuccessorEventIds.length}
                          </div>
                        </div>
                      </LuminaFlagshipCard>
                    </div>

                    <div className="rounded-[16px] border border-amber-300/16 bg-amber-300/[0.04] p-4">
                      <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-200/72">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Chronology boundary
                      </div>

                      <p className="mt-2 text-xs leading-5 text-amber-100/62">
                        Predecessor and successor links express deterministic temporal ordering only. They do not assert cause.
                      </p>
                    </div>

                    <Field label="Episode membership">
                      {selectedEntry.episodeIds.length} episode{
                        selectedEntry.episodeIds.length ===
                          1
                          ? ""
                          : "s"
                      }
                    </Field>

                    {selectedEntry.revisesEventId && (
                      <Field label="Revises event">
                        <span className="font-mono">
                          {selectedEntry.revisesEventId}
                        </span>
                      </Field>
                    )}

                    <div>
                      <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-300/52">
                        <Link2 className="h-3.5 w-3.5" />
                        Evidence-backed relationships
                      </div>

                      <div className="mt-3 grid gap-3">
                        {selectedRelationships.incoming.map(
                          (
                            relationship,
                          ) => (
                            <RelationshipCard
                              key={
                                relationship.relationshipId
                              }
                              relationship={
                                relationship
                              }
                              direction="incoming"
                            />
                          ),
                        )}

                        {selectedRelationships.outgoing.map(
                          (
                            relationship,
                          ) => (
                            <RelationshipCard
                              key={
                                relationship.relationshipId
                              }
                              relationship={
                                relationship
                              }
                              direction="outgoing"
                            />
                          ),
                        )}

                        {selectedRelationships.incoming.length ===
                          0 &&
                          selectedRelationships.outgoing.length ===
                            0 && (
                          <div className="rounded-[16px] border border-sky-300/10 bg-slate-950/24 p-4 text-xs leading-5 text-sky-300/52">
                            No evidence-backed Historical Relationships are attached to this Event.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </LuminaFlagshipCard>
          </div>
        )}
      </div>
    </LuminaFlagshipPanel>
  );
}

export default GenesisTemporalChronologyInspector;
