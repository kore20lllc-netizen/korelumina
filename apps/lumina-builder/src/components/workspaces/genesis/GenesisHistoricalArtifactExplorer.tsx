import {
  useMemo,
  useState,
} from "react";

import {
  Clock3,
  FileSearch,
  GitBranch,
  History,
  Layers3,
  Link2,
} from "lucide-react";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import type {
  GenesisCorpusSourceRecord,
  GenesisEvolutionEpisodeRecord,
  GenesisHistoricalEventRecord,
  GenesisOperationalProjection,
} from "@/services/runtime/genesisReplayRead";

type ArtifactKind =
  | "source"
  | "event"
  | "episode";

interface ArtifactSelection {
  kind:
    ArtifactKind;

  id:
    string;
}

export interface GenesisHistoricalArtifactExplorerProps {
  projection:
    GenesisOperationalProjection;
}

function formatTimestamp(
  value:
    number,
): string {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return "Unknown";
  }

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

function Chip({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span
      className="
        inline-flex items-center rounded-full
        border border-cyan-300/20
        bg-cyan-400/[0.06]
        px-2.5 py-1
        text-[10px] font-semibold uppercase
        tracking-[0.11em] text-cyan-200/75
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
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-300/55">
        {label}
      </div>

      <div className="mt-1 break-words text-xs leading-5 text-white/72">
        {children}
      </div>
    </div>
  );
}

function ArtifactButton({
  selected,
  title,
  detail,
  meta,
  onClick,
}: {
  selected:
    boolean;

  title:
    string;

  detail:
    string;

  meta:
    string;

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
      className="w-full p-4 text-left"
    >
      <div className="relative z-10 min-w-0">
        <div className="truncate text-sm font-semibold text-cyan-100/90">
          {title}
        </div>

        <div className="mt-1 truncate font-mono text-[11px] text-white/45">
          {detail}
        </div>

        <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300/68">
          {meta}
        </div>
      </div>
    </LuminaFlagshipCard>
  );
}

function SourceInspector({
  source,
}: {
  source:
    GenesisCorpusSourceRecord;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Chip>
          {source.sourceClass}
        </Chip>

        <Chip>
          {source.acquisitionState}
        </Chip>

        {source.externalSource && (
          <Chip>
            External source
          </Chip>
        )}
      </div>

      <Field label="Source identity">
        <span className="font-mono">
          {source.sourceIdentity}
        </span>
      </Field>

      <Field label="Source reference">
        <span className="font-mono">
          {source.sourceReferenceId}
        </span>
      </Field>

      <Field label="Revision">
        <span className="font-mono">
          {source.sourceRevisionId}
        </span>
      </Field>

      <Field label="Evidence type">
        {source.evidenceType}
      </Field>

      <Field label="Provenance">
        {source.provenance.locator ??
          source.provenance.sourceReference ??
          source.provenance.nativeId ??
          "No locator recorded"}
      </Field>

      <Field label="Historical linkage">
        {source.eventIds.length} event{
          source.eventIds.length ===
          1
            ? ""
            : "s"
        } · {source.episodeIds.length} episode{
          source.episodeIds.length ===
          1
            ? ""
            : "s"
        }
      </Field>
    </div>
  );
}

function EventInspector({
  event,
}: {
  event:
    GenesisHistoricalEventRecord;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Chip>
          {event.kind}
        </Chip>

        <Chip>
          {event.temporalAuthority.historical.status}
        </Chip>

        <Chip>
          {event.temporalAuthority.current.status}
        </Chip>
      </div>

      <Field label="Event identity">
        <span className="font-mono">
          {event.eventId}
        </span>
      </Field>

      <Field label="Occurred">
        {formatTimestamp(
          event.occurredAt,
        )}
      </Field>

      <Field label="Observation key">
        <span className="font-mono">
          {event.observationKey}
        </span>
      </Field>

      <Field label="Summary">
        {event.summary ??
          "No historical summary recorded"}
      </Field>

      <Field label="Source provenance">
        {event.sourceReferenceIds.length} source reference{
          event.sourceReferenceIds.length ===
          1
            ? ""
            : "s"
        }
      </Field>

      {event.revisesEventId && (
        <Field label="Revises event">
          <span className="font-mono">
            {event.revisesEventId}
          </span>
        </Field>
      )}
    </div>
  );
}

function EpisodeInspector({
  episode,
}: {
  episode:
    GenesisEvolutionEpisodeRecord;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Chip>
          {episode.lifecycle}
        </Chip>

        <Chip>
          external context: {
            episode.externalContext
          }
        </Chip>

        <Chip>
          {episode.temporalAuthority.current.status}
        </Chip>
      </div>

      <Field label="Episode identity">
        <span className="font-mono">
          {episode.episodeId}
        </span>
      </Field>

      <Field label="Revision identity">
        <span className="font-mono">
          {episode.revisionId}
        </span>
      </Field>

      <Field label="Episode key">
        <span className="font-mono">
          {episode.episodeKey}
        </span>
      </Field>

      <Field label="Historical membership">
        {episode.sourceReferenceIds.length} source{
          episode.sourceReferenceIds.length ===
          1
            ? ""
            : "s"
        } · {episode.eventIds.length} event{
          episode.eventIds.length ===
          1
            ? ""
            : "s"
        } · {episode.relationshipIds.length} relationship{
          episode.relationshipIds.length ===
          1
            ? ""
            : "s"
        }
      </Field>

      <Field label="Revision lineage">
        previous {
          episode.lineage.previousRevisionId
            ? "yes"
            : "no"
        } · merged from {
          episode.lineage.mergedFrom.length
        } · supersedes {
          episode.lineage.supersedes.length
        }{
          episode.lineage.splitFrom
            ? " · split lineage present"
            : ""
        }
      </Field>

      <Field label="Historical authority">
        {episode.temporalAuthority.historical.status}
      </Field>

      <Field label="Current authority">
        {episode.temporalAuthority.current.status}
      </Field>
    </div>
  );
}

export function GenesisHistoricalArtifactExplorer({
  projection,
}: GenesisHistoricalArtifactExplorerProps) {
  const {
    sources,
    events,
    episodes,
    relationships,
  } =
    projection.corpus;

  const [kind, setKind] =
    useState<ArtifactKind>(
      "source",
    );

  const [selection, setSelection] =
    useState<ArtifactSelection | null>(
      null,
    );

  const selectedSource =
    useMemo(
      () =>
        selection?.kind ===
        "source"
          ? sources.find(
              (
                source,
              ) =>
                source.sourceReferenceId ===
                selection.id,
            ) ??
            null
          : null,
      [
        selection,
        sources,
      ],
    );

  const selectedEvent =
    useMemo(
      () =>
        selection?.kind ===
        "event"
          ? events.find(
              (
                event,
              ) =>
                event.eventId ===
                selection.id,
            ) ??
            null
          : null,
      [
        events,
        selection,
      ],
    );

  const selectedEpisode =
    useMemo(
      () =>
        selection?.kind ===
        "episode"
          ? episodes.find(
              (
                episode,
              ) =>
                episode.episodeId ===
                selection.id,
            ) ??
            null
          : null,
      [
        episodes,
        selection,
      ],
    );

  const visibleCount =
    kind === "source"
      ? sources.length
      : kind === "event"
        ? events.length
        : episodes.length;

  return (
    <LuminaFlagshipPanel
      title="Historical artifact explorer"
      description="Inspect provenance-preserving Sources, normalized Historical Events, and governed Evolution Episodes from the selected Replay."
      toolbar={
        <div className="flex flex-wrap gap-2">
          <Chip>
            {relationships.length} relationships
          </Chip>

          <Chip>
            {visibleCount} visible
          </Chip>
        </div>
      }
    >
      <div className="relative z-10 p-5">
        <div
          role="tablist"
          aria-label="Genesis historical artifact classes"
          className="
            grid gap-2 rounded-2xl border
            border-cyan-300/20 bg-slate-950/55 p-2
            sm:grid-cols-3
          "
        >
          {[
            {
              kind:
                "source" as const,
              label:
                "Sources",
              icon:
                Layers3,
              count:
                sources.length,
            },
            {
              kind:
                "event" as const,
              label:
                "Events",
              icon:
                Clock3,
              count:
                events.length,
            },
            {
              kind:
                "episode" as const,
              label:
                "Evolution Episodes",
              icon:
                History,
              count:
                episodes.length,
            },
          ].map(
            (
              item,
            ) => {
              const Icon =
                item.icon;

              const active =
                kind ===
                item.kind;

              return (
                <button
                  key={
                    item.kind
                  }
                  type="button"
                  role="tab"
                  aria-selected={
                    active
                  }
                  onClick={() => {
                    setKind(
                      item.kind,
                    );

                    setSelection(
                      null,
                    );
                  }}
                  className={[
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
                    "text-xs font-semibold transition",
                    active
                      ? "border-cyan-200/65 bg-cyan-400/[0.10] text-cyan-100"
                      : "border-transparent text-white/48 hover:border-cyan-300/25 hover:text-white/78",
                  ].join(
                    " ",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>

                  <span className="font-mono text-[10px]">
                    {item.count}
                  </span>
                </button>
              );
            },
          )}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
          <div className="min-h-[360px]">
            {visibleCount ===
            0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-8 text-center">
                <FileSearch className="h-6 w-6 text-cyan-300/50" />

                <div className="mt-4 text-sm font-semibold text-white/78">
                  No {
                    kind === "source"
                      ? "Sources"
                      : kind === "event"
                        ? "Historical Events"
                        : "Evolution Episodes"
                  } projected
                </div>

                <p className="mt-2 max-w-md text-xs leading-5 text-white/42">
                  Genesis does not fabricate missing historical artifacts.
                  The selected Replay currently exposes no records for this
                  historical layer.
                </p>
              </div>
            ) : (
              <div className="max-h-[520px] min-w-0 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 [scrollbar-gutter:stable] [touch-action:pan-y]">
                {kind ===
                  "source" &&
                  sources.map(
                    (
                      source,
                    ) => (
                      <ArtifactButton
                        key={
                          source.sourceReferenceId
                        }
                        selected={
                          selection?.kind ===
                            "source" &&
                          selection.id ===
                            source.sourceReferenceId
                        }
                        title={
                          source.sourceIdentity
                        }
                        detail={
                          source.sourceReferenceId
                        }
                        meta={`${source.sourceClass} · ${source.acquisitionState}`}
                        onClick={() => {
                          setSelection({
                            kind:
                              "source",
                            id:
                              source.sourceReferenceId,
                          });
                        }}
                      />
                    ),
                  )}

                {kind ===
                  "event" &&
                  events.map(
                    (
                      event,
                    ) => (
                      <ArtifactButton
                        key={
                          event.eventId
                        }
                        selected={
                          selection?.kind ===
                            "event" &&
                          selection.id ===
                            event.eventId
                        }
                        title={
                          event.summary ??
                          event.kind
                        }
                        detail={
                          event.eventId
                        }
                        meta={`${event.kind} · ${formatTimestamp(event.occurredAt)}`}
                        onClick={() => {
                          setSelection({
                            kind:
                              "event",
                            id:
                              event.eventId,
                          });
                        }}
                      />
                    ),
                  )}

                {kind ===
                  "episode" &&
                  episodes.map(
                    (
                      episode,
                    ) => (
                      <ArtifactButton
                        key={
                          episode.episodeId
                        }
                        selected={
                          selection?.kind ===
                            "episode" &&
                          selection.id ===
                            episode.episodeId
                        }
                        title={
                          episode.title
                        }
                        detail={
                          episode.episodeId
                        }
                        meta={`${episode.lifecycle} · context ${episode.externalContext}`}
                        onClick={() => {
                          setSelection({
                            kind:
                              "episode",
                            id:
                              episode.episodeId,
                          });
                        }}
                      />
                    ),
                  )}
              </div>
            )}
          </div>

          <LuminaFlagshipCard
            as="article"
            className="min-h-[360px] p-5"
          >
            <div className="relative z-10">
              {!selection && (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <GitBranch className="h-6 w-6 text-cyan-300/50" />

                  <div className="mt-4 text-sm font-semibold text-white/78">
                    Select a historical artifact
                  </div>

                  <p className="mt-2 max-w-sm text-xs leading-5 text-white/42">
                    Inspect stable identity, provenance, temporal authority,
                    external context, and revision lineage without changing
                    historical state.
                  </p>
                </div>
              )}

              {selectedSource && (
                <SourceInspector
                  source={
                    selectedSource
                  }
                />
              )}

              {selectedEvent && (
                <EventInspector
                  event={
                    selectedEvent
                  }
                />
              )}

              {selectedEpisode && (
                <EpisodeInspector
                  episode={
                    selectedEpisode
                  }
                />
              )}

              {selection &&
                !selectedSource &&
                !selectedEvent &&
                !selectedEpisode && (
                  <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                    <Link2 className="h-6 w-6 text-amber-300/50" />

                    <div className="mt-4 text-sm font-semibold text-white/78">
                      Historical artifact no longer projected
                    </div>

                    <p className="mt-2 text-xs leading-5 text-white/42">
                      The selected identity is not present in the current
                      replay-scoped projection.
                    </p>
                  </div>
                )}
            </div>
          </LuminaFlagshipCard>
        </div>
      </div>
    </LuminaFlagshipPanel>
  );
}

export default GenesisHistoricalArtifactExplorer;
