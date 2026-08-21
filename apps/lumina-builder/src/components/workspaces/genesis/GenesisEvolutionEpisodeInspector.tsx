import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  GitBranch,
  Layers3,
  Network,
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
  GenesisEvolutionEpisodeNavigationTarget,
} from "./GenesisHistoricalNavigation";

import type {
  GenesisEvolutionEpisodeRecord,
  GenesisOperationalProjection,
} from "@/services/runtime/genesisReplayRead";

import type {
  GenesisHistoricalArtifactNavigationTarget,
} from "./GenesisHistoricalNavigation";

export interface GenesisEvolutionEpisodeInspectorProps {
  projection:
    GenesisOperationalProjection;

  navigationTarget?:
    GenesisEvolutionEpisodeNavigationTarget;

  onNavigateToArtifact?(
    target:
      Omit<
        GenesisHistoricalArtifactNavigationTarget,
        "requestId"
      >,
  ): void;
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

function episodeMaterializationMode(
  episode:
    GenesisEvolutionEpisodeRecord,
): string {
  const mode =
    episode.metadata[
      "materializationMode"
    ];

  return typeof mode ===
    "string"
      ? mode
      : "Runtime correlation";
}

function EpisodeRow({
  episode,
  selected,
  onClick,
}: {
  episode:
    GenesisEvolutionEpisodeRecord;

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
        <div className="flex flex-wrap gap-2">
          <Badge>
            {episode.lifecycle}
          </Badge>

          <Badge>
            {episode.externalContext}
          </Badge>

          <Badge>
            {episode.eventIds.length} events
          </Badge>
        </div>

        <div className="mt-3 break-words text-sm font-semibold leading-5 text-white/86 [overflow-wrap:anywhere]">
          {episode.title}
        </div>

        <div className="mt-2 truncate font-mono text-[10px] text-white/40">
          {episode.episodeId}
        </div>
      </div>
    </LuminaFlagshipCard>
  );
}

export function GenesisEvolutionEpisodeInspector({
  projection,
  onNavigateToArtifact,
  navigationTarget,
}: GenesisEvolutionEpisodeInspectorProps) {
  const episodes =
    projection.corpus
      .episodes;

  const [selectedId, setSelectedId] =
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

      const episode =
        episodes.find(
          candidate =>
            candidate.episodeId ===
            navigationTarget.episodeId,
        );

      if (
        episode
      ) {
        setSelectedId(
          episode.episodeId,
        );
      }
    },
    [
      episodes,
      navigationTarget,
    ],
  );

  const selected =
    useMemo(
      () =>
        selectedId
          ? episodes.find(
              episode =>
                episode.episodeId ===
                selectedId,
            ) ??
            null
          : null,
      [
        episodes,
        selectedId,
      ],
    );

  const conflicted =
    episodes.filter(
      episode =>
        episode.lifecycle ===
        "conflicted",
    ).length;

  const pendingContext =
    episodes.filter(
      episode =>
        episode.externalContext ===
        "pending",
    ).length;

  return (
    <LuminaFlagshipPanel
      title="Evolution episodes"
      description="Governed historical evolution groups derived only from explicit semantic correlation. Replay membership and chronology alone never create an Episode."
      toolbar={
        <div className="flex flex-wrap gap-2">
          <Badge>
            {episodes.length} episodes
          </Badge>

          <Badge>
            {conflicted} conflicted
          </Badge>

          <Badge>
            {pendingContext} context pending
          </Badge>
        </div>
      }
    >
      <div className="relative z-10 p-5">
        {episodes.length ===
        0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-8 text-center">
            <Layers3 className="h-6 w-6 text-cyan-300/48" />

            <div className="mt-4 text-sm font-semibold text-white/78">
              No Evolution Episodes projected
            </div>

            <p className="mt-2 max-w-xl text-xs leading-5 text-white/42">
              The persisted replay contains Historical Events and Relationships, but none currently satisfy the governed semantic threshold required to form an Evolution Episode.
            </p>

            <p className="mt-2 max-w-xl text-[11px] leading-5 text-amber-200/52">
              Genesis does not group artifacts merely because they belong to the same replay or occur near one another in time.
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
              aria-label="Genesis evolution episodes"
            >
              {episodes.map(
                episode => (
                  <EpisodeRow
                    key={
                      episode.episodeId
                    }
                    episode={
                      episode
                    }
                    selected={
                      selectedId ===
                      episode.episodeId
                    }
                    onClick={() => {
                      setSelectedId(
                        episode.episodeId,
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
                    <Network className="h-6 w-6 text-cyan-300/48" />

                    <div className="mt-4 text-sm font-semibold text-white/78">
                      Select an Evolution Episode
                    </div>

                    <p className="mt-2 max-w-sm text-xs leading-5 text-white/42">
                      Inspect lifecycle, temporal authority, source membership, relationship membership, external-context posture, and lineage.
                    </p>
                  </div>
                )}

                {selected && (
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      <Badge>
                        {selected.lifecycle}
                      </Badge>

                      <Badge>
                        {selected.externalContext}
                      </Badge>
                    </div>

                    <Field label="Episode title">
                      {selected.title}
                    </Field>

                    <Field label="Episode identity">
                      <span className="font-mono">
                        {selected.episodeId}
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
                              "episode",

                            id:
                              selected.episodeId,
                          });
                        }}
                      >
                        Open Episode in Historical Artifacts
                      </LuminaButton>
                    )}

                    <Field label="Revision identity">
                      <span className="font-mono">
                        {selected.revisionId}
                      </span>
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <LuminaFlagshipCard
                        as="article"
                        className="rounded-[16px] p-3"
                      >
                        <div className="relative z-10">
                          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/54">
                            Events
                          </div>

                          <div className="mt-2 text-lg font-semibold text-amber-300">
                            {selected.eventIds.length}
                          </div>
                        </div>
                      </LuminaFlagshipCard>

                      <LuminaFlagshipCard
                        as="article"
                        className="rounded-[16px] p-3"
                      >
                        <div className="relative z-10">
                          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/54">
                            Relationships
                          </div>

                          <div className="mt-2 text-lg font-semibold text-amber-300">
                            {selected.relationshipIds.length}
                          </div>
                        </div>
                      </LuminaFlagshipCard>

                      <LuminaFlagshipCard
                        as="article"
                        className="rounded-[16px] p-3"
                      >
                        <div className="relative z-10">
                          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/54">
                            Sources
                          </div>

                          <div className="mt-2 text-lg font-semibold text-amber-300">
                            {selected.sourceReferenceIds.length}
                          </div>
                        </div>
                      </LuminaFlagshipCard>
                    </div>

                    <Field label="Historical authority">
                      {selected.temporalAuthority.historical.status}
                    </Field>

                    <Field label="Current authority">
                      {selected.temporalAuthority.current.status}
                    </Field>

                    <Field label="Materialization mode">
                      {episodeMaterializationMode(
                        selected,
                      )}
                    </Field>

                    <Field label="Previous revision">
                      {selected.lineage.previousRevisionId ??
                        "None"}
                    </Field>

                    <Field label="Merged from">
                      {selected.lineage.mergedFrom.length}
                    </Field>

                    <Field label="Supersedes">
                      {selected.lineage.supersedes.length}
                    </Field>

                    <div className="rounded-[16px] border border-amber-300/16 bg-amber-300/[0.04] p-4">
                      <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-200/72">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Episode integrity
                      </div>

                      <p className="mt-2 text-xs leading-5 text-amber-100/62">
                        Evolution Episodes are derived from governed semantic correlation only. Chronological adjacency and replay membership remain insufficient evidence.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-cyan-300/52">
                      <GitBranch className="h-3.5 w-3.5" />
                      Episode lineage remains Runtime-governed and read-only.
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

export default GenesisEvolutionEpisodeInspector;
