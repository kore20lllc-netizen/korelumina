import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgeOperationsService,
} from "../KnowledgeOperationsService.js";

import type {
  KnowledgeOperationsRuntimeTruth,
} from "../KnowledgeOperationsService.js";

function runtimeTruth():
KnowledgeOperationsRuntimeTruth {
  return {
    packageService: {
      list:
        () => [
          {
            id:
              "KP-production",

            sourceEvidenceRefs: [
              "evidence:production",
            ],

            knowledgeItemIds: [
              "IR-production",
            ],

            items: [
              {
                id:
                  "IR-production",

                title:
                  "Production knowledge",

                evidenceRefs: [
                  "evidence:production",
                ],

                compiler: {
                  evidenceSourceType:
                    "document",
                },

                metadata: {
                  sourceLocation:
                    "package.json",

                  contentRef:
                    "package.json",

                  source:
                    "repository",
                },
              },
            ],

            provenance: {
              evidenceIds: [
                "evidence:production",
              ],

              sourceLocations: [
                "package.json",
              ],

              contentRefs: [
                "package.json",
              ],

              sources: [
                "repository",
              ],
            },
          },
        ],
    },

    manufacturingRunService: {
      list:
        () => [
          {
            evidenceId:
              "evidence:production",

            status:
              "completed",
          },
        ],
    },

    canonicalStore: {
      list:
        () => [
          {
            id:
              "canonical:IR-production",

            status:
              "canonical",

            evidenceRefs: [
              "evidence:production",
            ],

            metadata:
              {},
          },

          {
            id:
              "canonical:IR-test",

            status:
              "canonical",

            evidenceRefs: [
              "evidence:test",
            ],

            metadata:
              {},
          },
        ],
    },
  } as unknown as
    KnowledgeOperationsRuntimeTruth;
}

test(
  "canonical count excludes persisted canonical records without admitted evidence lineage",
  () => {
    const snapshot =
      new KnowledgeOperationsService(
        runtimeTruth(),
      )
        .getSnapshot();

    assert.equal(
      snapshot.evidence.total,
      1,
    );

    assert.equal(
      snapshot.knowledge.canonicalItems,
      1,
    );

    assert.equal(
      snapshot.summary.totalKnowledgeItems,
      1,
    );

    assert.equal(
      snapshot.knowledge.candidateItems,
      0,
    );

    assert.equal(
      snapshot.knowledge.promotionRate,
      1,
    );
  },
);
