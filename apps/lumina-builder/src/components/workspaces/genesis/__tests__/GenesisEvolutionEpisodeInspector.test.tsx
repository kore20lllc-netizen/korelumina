import React from "react";

import {
  renderToString,
} from "react-dom/server";

import {
  describe,
  expect,
  test,
} from "vitest";

import {
  GenesisEvolutionEpisodeInspector,
} from "../GenesisEvolutionEpisodeInspector";

import type {
  GenesisOperationalProjection,
} from "@/services/runtime/genesisReplayRead";

function normalize(
  value:
    string,
): string {
  return value
    .replace(
      /<!-- -->/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    );
}

function fixture(
  withEpisode:
    boolean,
): GenesisOperationalProjection {
  return {
    corpus: {
      episodes:
        withEpisode
          ? [
              {
                episodeId:
                  "genesis-episode:test",

                revisionId:
                  "genesis-episode-revision:test",

                episodeKey:
                  "source-evolution:test",

                title:
                  "Evolution · architecture.md",

                lifecycle:
                  "correlated",

                eventIds: [
                  "genesis-event:a",
                  "genesis-event:b",
                ],

                relationshipIds: [
                  "genesis-relationship:a",
                ],

                sourceReferenceIds: [
                  "genesis-source-ref:a",
                ],

                externalContext:
                  "not-required",

                temporalAuthority: {
                  historical: {
                    status:
                      "historically-observed",
                  },

                  current: {
                    status:
                      "unknown",
                  },
                },

                lineage: {
                  mergedFrom:
                    [],

                  supersedes:
                    [],
                },

                metadata: {
                  materializationMode:
                    "logical-source-revision-lineage",
                },
              },
            ]
          : [],
    },
  } as unknown as GenesisOperationalProjection;
}

describe(
  "GenesisEvolutionEpisodeInspector",
  () => {
    test(
      "renders truthful empty state when Runtime projects no episodes",
      () => {
        const html =
          normalize(
            renderToString(
              React.createElement(
                GenesisEvolutionEpisodeInspector,
                {
                  projection:
                    fixture(
                      false,
                    ),
                },
              ),
            ),
          );

        expect(
          html,
        ).toContain(
          "No Evolution Episodes projected",
        );

        expect(
          html,
        ).toContain(
          "same replay",
        );
      },
    );

    test(
      "renders Runtime projected episodes without local synthesis",
      () => {
        const html =
          normalize(
            renderToString(
              React.createElement(
                GenesisEvolutionEpisodeInspector,
                {
                  projection:
                    fixture(
                      true,
                    ),
                },
              ),
            ),
          );

        expect(
          html,
        ).toContain(
          "Evolution episodes",
        );

        expect(
          html,
        ).toContain(
          "1 episodes",
        );

        expect(
          html,
        ).toContain(
          "Evolution · architecture.md",
        );
      },
    );
  },
);
