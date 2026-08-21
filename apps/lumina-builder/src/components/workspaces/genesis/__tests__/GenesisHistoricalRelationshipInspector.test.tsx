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
  GenesisHistoricalRelationshipInspector,
} from "../GenesisHistoricalRelationshipInspector";

import type {
  GenesisOperationalProjection,
} from "@/services/runtime/genesisReplayRead";

function normalizeRenderedHtml(
  html:
    string,
): string {
  return html
    .replace(
      /<!-- -->/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    );
}

function fixture():
  GenesisOperationalProjection {
  return {
    corpus: {
      sources: [
        {
          sourceReferenceId:
            "genesis-source-ref:architecture",

          sourceRevisionId:
            "genesis-source-revision:architecture",

          sourceIdentity:
            "docs/architecture/GENESIS.md",

          sourceClass:
            "architecture-document",

          evidenceType:
            "document",

          externalSource:
            false,

          acquisitionState:
            "acquired",

          provenance: {
            externalSource:
              false,
          },

          eventIds:
            [
              "genesis-event:approved",
            ],

          episodeIds:
            [
              "genesis-episode:evolution",
            ],

          metadata:
            {},
        },
      ],

      events: [
        {
          eventId:
            "genesis-event:approved",

          kind:
            "decision-approved",

          observationKey:
            "decision-approved",

          occurredAt:
            1,

          sourceReferenceIds:
            [
              "genesis-source-ref:architecture",
            ],

          sourceRevisionIds:
            [
              "genesis-source-revision:architecture",
            ],

          summary:
            "Architecture approved",

          temporalAuthority: {
            historical: {
              status:
                "historically-authoritative",
            },

            current: {
              status:
                "currently-authoritative",
            },
          },

          metadata:
            {},
        },
        {
          eventId:
            "genesis-event:implemented",

          kind:
            "implementation-committed",

          observationKey:
            "implementation",

          occurredAt:
            2,

          sourceReferenceIds:
            [
              "genesis-source-ref:architecture",
            ],

          sourceRevisionIds:
            [
              "genesis-source-revision:architecture",
            ],

          summary:
            "Architecture implemented",

          temporalAuthority: {
            historical: {
              status:
                "historically-implemented",
            },

            current: {
              status:
                "currently-implemented",
            },
          },

          metadata:
            {},
        },
      ],

      relationships: [
        {
          relationshipId:
            "genesis-relationship:implemented",

          from: {
            kind:
              "event",

            id:
              "genesis-event:approved",
          },

          to: {
            kind:
              "event",

            id:
              "genesis-event:implemented",
          },

          type:
            "implemented_by",

          causal:
            false,

          confidence:
            "strong",

          evidence: {
            mode:
              "structural-inference",

            confidence:
              "strong",

            sourceReferenceIds:
              [
                "genesis-source-ref:architecture",
              ],

            assertions:
              [
                "scope-aligned",
              ],

            rationale:
              "The implementation follows the approved architecture scope.",
          },
        },
      ],

      episodes: [
        {
          episodeId:
            "genesis-episode:evolution",

          revisionId:
            "genesis-episode-revision:evolution",

          episodeKey:
            "evolution",

          title:
            "Architecture evolution",

          lifecycle:
            "validated",

          eventIds:
            [
              "genesis-event:approved",
              "genesis-event:implemented",
            ],

          relationshipIds:
            [
              "genesis-relationship:implemented",
            ],

          sourceReferenceIds:
            [
              "genesis-source-ref:architecture",
            ],

          externalContext:
            "complete",

          temporalAuthority: {
            historical: {
              status:
                "historically-validated",
            },

            current: {
              status:
                "currently-implemented",
            },
          },

          lineage: {
            mergedFrom:
              [],

            supersedes:
              [],
          },

          metadata:
            {},
        },
      ],
    },

    chronology: {
      coverage: {
        unresolvedRelationshipIds:
          [],
      },
    },
  } as unknown as GenesisOperationalProjection;
}

describe(
  "GenesisHistoricalRelationshipInspector",
  () => {
    test(
      "renders Runtime relationship evidence without inferring causality",
      () => {
        const html =
          normalizeRenderedHtml(
            renderToString(
              React.createElement(
                GenesisHistoricalRelationshipInspector,
                {
                  projection:
                    fixture(),
                },
              ),
            ),
          );

        for (
          const text
          of [
            "Historical relationships",
            "1 relationships",
            "0 causal",
            "implemented_by",
            "strong",
            "Architecture approved",
            "Architecture implemented",
          ]
        ) {
          expect(
            html,
          ).toContain(
            text,
          );
        }

        expect(
          html,
        ).toContain(
          "without converting chronology into causality",
        );
      },
    );

    test(
      "renders truthful empty relationship state",
      () => {
        const projection =
          fixture();

        projection.corpus.relationships =
          [];

        const html =
          normalizeRenderedHtml(
            renderToString(
              React.createElement(
                GenesisHistoricalRelationshipInspector,
                {
                  projection,
                },
              ),
            ),
          );

        expect(
          html,
        ).toContain(
          "No Historical Relationships projected",
        );

        expect(
          html,
        ).toContain(
          "Genesis does not manufacture correlation",
        );
      },
    );
  },
);
