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
  GenesisTemporalChronologyInspector,
} from "../GenesisTemporalChronologyInspector";

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
    chronology: {
      projectionId:
        "genesis-chronology:test",

      corpusProjectionId:
        "genesis-corpus-projection:test",

      entries: [
        {
          chronologyEntryId:
            "genesis-chronology-entry:first",

          position:
            0,

          eventId:
            "genesis-event:first",

          occurredAt:
            1767225600000,

          kind:
            "decision-approved",

          summary:
            "Architecture decision approved",

          sourceReferenceIds:
            [
              "genesis-source-ref:architecture",
            ],

          sourceRevisionIds:
            [
              "genesis-source-revision:architecture",
            ],

          episodeIds:
            [
              "genesis-episode:evolution",
            ],

          incomingRelationshipIds:
            [],

          outgoingRelationshipIds:
            [
              "genesis-relationship:implemented",
            ],

          chronologicalPredecessorEventIds:
            [],

          chronologicalSuccessorEventIds:
            [
              "genesis-event:second",
            ],

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

          revisesEventId:
            null,

          metadata:
            {},
        },
        {
          chronologyEntryId:
            "genesis-chronology-entry:second",

          position:
            1,

          eventId:
            "genesis-event:second",

          occurredAt:
            1767229200000,

          kind:
            "implementation-committed",

          summary:
            "Implementation committed",

          sourceReferenceIds:
            [
              "genesis-source-ref:commit",
            ],

          sourceRevisionIds:
            [
              "genesis-source-revision:commit",
            ],

          episodeIds:
            [
              "genesis-episode:evolution",
            ],

          incomingRelationshipIds:
            [
              "genesis-relationship:implemented",
            ],

          outgoingRelationshipIds:
            [],

          chronologicalPredecessorEventIds:
            [
              "genesis-event:first",
            ],

          chronologicalSuccessorEventIds:
            [],

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

          revisesEventId:
            null,

          metadata:
            {},
        },
      ],

      authority: {
        historicallyAuthoritative:
          1,

        historicallyProposed:
          0,

        historicallyRejected:
          0,

        historicallyImplemented:
          1,

        historicallyValidated:
          0,

        historicallyObserved:
          0,

        historicalUnknown:
          0,

        currentlyAuthoritative:
          1,

        currentlyImplemented:
          1,

        currentlySuperseded:
          0,

        currentlyRetired:
          0,

        currentNotApplicable:
          0,

        currentUnknown:
          0,
      },

      coverage: {
        totalEvents:
          2,

        earliestOccurredAt:
          1767225600000,

        latestOccurredAt:
          1767229200000,

        equalTimestampGroups:
          [],

        sourceRevisionsWithoutHistoricalEvents:
          [],

        episodesWithExternalContextPending:
          [],

        conflictedEpisodes:
          [],

        unresolvedRelationshipIds:
          [],

        complete:
          true,
      },
    },

    corpus: {
      relationships: [
        {
          relationshipId:
            "genesis-relationship:implemented",

          from: {
            kind:
              "event",

            id:
              "genesis-event:first",
          },

          to: {
            kind:
              "event",

            id:
              "genesis-event:second",
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
                "genesis-source-ref:commit",
              ],

            assertions:
              [
                "scope-aligned",
              ],
          },
        },
      ],
    },
  } as unknown as GenesisOperationalProjection;
}

describe(
  "GenesisTemporalChronologyInspector",
  () => {
    test(
      "renders deterministic chronology without representing sequence as causality",
      () => {
        const html =
          normalizeRenderedHtml(
            renderToString(
              React.createElement(
                GenesisTemporalChronologyInspector,
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
            "Temporal chronology",
            "2 events",
            "Historically authoritative",
            "Architecture decision approved",
            "Implementation committed",
            "Sequence is never promoted to causality",
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
        ).not.toContain(
          "chronology proves causality",
        );
      },
    );

    test(
      "renders truthful empty chronology",
      () => {
        const projection =
          fixture();

        projection.chronology.entries =
          [];

        projection.chronology.coverage.totalEvents =
          0;

        const html =
          normalizeRenderedHtml(
            renderToString(
              React.createElement(
                GenesisTemporalChronologyInspector,
                {
                  projection,
                },
              ),
            ),
          );

        expect(
          html,
        ).toContain(
          "No historical chronology projected",
        );

        expect(
          html,
        ).toContain(
          "Genesis does not invent chronology",
        );
      },
    );
  },
);
