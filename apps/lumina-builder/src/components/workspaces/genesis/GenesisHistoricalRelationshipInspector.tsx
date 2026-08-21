import {
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  GitBranch,
  Link2,
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
  GenesisHistoricalRelationshipRecord,
  GenesisOperationalProjection,
} from "@/services/runtime/genesisReplayRead";

export interface GenesisHistoricalRelationshipInspectorProps {
  projection:
    GenesisOperationalProjection;
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

function endpointLabel(
  projection:
    GenesisOperationalProjection,

  endpoint:
    GenesisHistoricalRelationshipRecord["from"],
): string {
  if (
    endpoint.kind ===
    "source"
  ) {
    const source =
      projection.corpus.sources.find(
        item =>
          item.sourceReferenceId ===
          endpoint.id,
      );

    return (
      source?.sourceIdentity ??
      endpoint.id
    );
  }

  const event =
    projection.corpus.events.find(
      item =>
        item.eventId ===
        endpoint.id,
    );

  return (
    event?.summary ??
    event?.kind ??
    endpoint.id
  );
}

function endpointEpisodeIds(
  projection:
    GenesisOperationalProjection,

  endpoint:
    GenesisHistoricalRelationshipRecord["from"],
): readonly string[] {
  if (
    endpoint.kind ===
    "source"
  ) {
    return (
      projection.corpus.sources.find(
        item =>
          item.sourceReferenceId ===
          endpoint.id,
      )?.episodeIds ??
      []
    );
  }

  return projection.corpus.episodes
    .filter(
      episode =>
        episode.eventIds.includes(
          endpoint.id,
        ),
    )
    .map(
      episode =>
        episode.episodeId,
    );
}

function RelationshipRow({
  relationship,
  selected,
  projection,
  onClick,
}: {
  relationship:
    GenesisHistoricalRelationshipRecord;

  selected:
    boolean;

  projection:
    GenesisOperationalProjection;

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
        <div className="flex flex-wrap gap-2">
          <Badge>
            {relationship.type}
          </Badge>

          <Badge>
            {relationship.confidence}
          </Badge>

          <Badge>
            {relationship.causal
              ? "causal"
              : "non-causal"}
          </Badge>
        </div>

        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
          <div className="min-w-0">
            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/48">
              From · {relationship.from.kind}
            </div>

            <div className="mt-1 truncate text-xs font-semibold text-white/78">
              {endpointLabel(
                projection,
                relationship.from,
              )}
            </div>
          </div>

          <ArrowRight className="hidden h-4 w-4 text-amber-300/60 sm:block" />

          <div className="min-w-0">
            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/48">
              To · {relationship.to.kind}
            </div>

            <div className="mt-1 truncate text-xs font-semibold text-white/78">
              {endpointLabel(
                projection,
                relationship.to,
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 truncate font-mono text-[10px] text-white/38">
          {relationship.relationshipId}
        </div>
      </div>
    </LuminaFlagshipCard>
  );
}

export function GenesisHistoricalRelationshipInspector({
  projection,
}: GenesisHistoricalRelationshipInspectorProps) {
  const relationships =
    projection.corpus.relationships;

  const [selectedId, setSelectedId] =
    useState<string | null>(
      null,
    );

  const selected =
    useMemo(
      () =>
        selectedId
          ? relationships.find(
              relationship =>
                relationship.relationshipId ===
                selectedId,
            ) ??
            null
          : null,
      [
        relationships,
        selectedId,
      ],
    );

  const unresolved =
    projection.chronology
      .coverage
      .unresolvedRelationshipIds;

  const causalCount =
    relationships.filter(
      relationship =>
        relationship.causal,
    ).length;

  const selectedFromEpisodes =
    selected
      ? endpointEpisodeIds(
          projection,
          selected.from,
        )
      : [];

  const selectedToEpisodes =
    selected
      ? endpointEpisodeIds(
          projection,
          selected.to,
        )
      : [];

  return (
    <LuminaFlagshipPanel
      title="Historical relationships"
      description="Inspect Runtime-derived historical correlations, confidence, evidence, endpoint identity, and Episode context without converting chronology into causality."
      toolbar={
        <div className="flex flex-wrap gap-2">
          <Badge>
            {relationships.length} relationships
          </Badge>

          <Badge>
            {causalCount} causal
          </Badge>

          <Badge>
            {unresolved.length} unresolved
          </Badge>
        </div>
      }
    >
      <div className="relative z-10 p-5">
        {relationships.length ===
        0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-8 text-center">
            <Network className="h-6 w-6 text-cyan-300/48" />

            <div className="mt-4 text-sm font-semibold text-white/78">
              No Historical Relationships projected
            </div>

            <p className="mt-2 max-w-md text-xs leading-5 text-white/42">
              Genesis does not manufacture correlation when Runtime has not projected evidence-backed relationships.
            </p>
          </div>
        ) : (
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
            <div
              className="
                max-h-[560px] min-w-0 space-y-3
                overflow-y-auto overflow-x-hidden
                overscroll-contain pr-1
                [scrollbar-gutter:stable]
                [touch-action:pan-y]
              "
              aria-label="Genesis historical relationships"
            >
              {relationships.map(
                relationship => (
                  <RelationshipRow
                    key={
                      relationship.relationshipId
                    }
                    relationship={
                      relationship
                    }
                    projection={
                      projection
                    }
                    selected={
                      selectedId ===
                      relationship.relationshipId
                    }
                    onClick={() => {
                      setSelectedId(
                        relationship.relationshipId,
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
                {!selected && (
                  <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">
                    <Link2 className="h-6 w-6 text-cyan-300/48" />

                    <div className="mt-4 text-sm font-semibold text-white/78">
                      Select a Historical Relationship
                    </div>

                    <p className="mt-2 max-w-sm text-xs leading-5 text-white/42">
                      Inspect endpoint identity, confidence, evidence assertions, causal classification, and Evolution Episode context.
                    </p>
                  </div>
                )}

                {selected && (
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      <Badge>
                        {selected.type}
                      </Badge>

                      <Badge>
                        confidence: {
                          selected.confidence
                        }
                      </Badge>

                      <Badge>
                        {selected.causal
                          ? "explicitly causal"
                          : "not causal"}
                      </Badge>
                    </div>

                    <Field label="Relationship identity">
                      <span className="font-mono">
                        {selected.relationshipId}
                      </span>
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <LuminaFlagshipCard
                        as="article"
                        className="rounded-[16px] p-4"
                      >
                        <div className="relative z-10 space-y-3">
                          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/54">
                            <GitBranch className="h-3.5 w-3.5" />
                            From endpoint
                          </div>

                          <Field label="Kind">
                            {selected.from.kind}
                          </Field>

                          <Field label="Identity">
                            <span className="font-mono">
                              {selected.from.id}
                            </span>
                          </Field>

                          <Field label="Resolved label">
                            {endpointLabel(
                              projection,
                              selected.from,
                            )}
                          </Field>

                          <Field label="Episode membership">
                            {selectedFromEpisodes.length}
                          </Field>
                        </div>
                      </LuminaFlagshipCard>

                      <LuminaFlagshipCard
                        as="article"
                        className="rounded-[16px] p-4"
                      >
                        <div className="relative z-10 space-y-3">
                          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/54">
                            <GitBranch className="h-3.5 w-3.5" />
                            To endpoint
                          </div>

                          <Field label="Kind">
                            {selected.to.kind}
                          </Field>

                          <Field label="Identity">
                            <span className="font-mono">
                              {selected.to.id}
                            </span>
                          </Field>

                          <Field label="Resolved label">
                            {endpointLabel(
                              projection,
                              selected.to,
                            )}
                          </Field>

                          <Field label="Episode membership">
                            {selectedToEpisodes.length}
                          </Field>
                        </div>
                      </LuminaFlagshipCard>
                    </div>

                    <div className="rounded-[16px] border border-amber-300/16 bg-amber-300/[0.04] p-4">
                      <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-200/72">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Causality boundary
                      </div>

                      <p className="mt-2 text-xs leading-5 text-amber-100/62">
                        The causal flag shown here comes from Runtime correlation evidence. Temporal ordering, adjacency, or shared Episode membership does not upgrade this relationship to causality.
                      </p>
                    </div>

                    <Field label="Evidence mode">
                      {selected.evidence.mode}
                    </Field>

                    <Field label="Evidence confidence">
                      {selected.evidence.confidence}
                    </Field>

                    <Field label="Evidence source references">
                      {selected.evidence.sourceReferenceIds.length}
                    </Field>

                    <Field label="Assertions">
                      {selected.evidence.assertions.length >
                      0
                        ? selected.evidence.assertions.join(
                            " · ",
                          )
                        : "No assertions recorded"}
                    </Field>

                    {selected.evidence.rationale && (
                      <Field label="Rationale">
                        {selected.evidence.rationale}
                      </Field>
                    )}
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

export default GenesisHistoricalRelationshipInspector;
