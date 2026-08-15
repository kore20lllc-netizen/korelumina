import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceItem,
  EvidenceType,
} from "../EvidenceItem.js";

import {
  assertValidEvidenceItem,
  evidenceTypes,
} from "../EvidenceIntakeContract.js";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/createKnowledgePreservationPlatform.js";

function validEvidence(
  type:
    EvidenceType =
      "commit",
): EvidenceItem {
  const now =
    Date.now();

  return {
    id:
      `EVIDENCE-${type}-${now}`,

    type,

    title:
      `Valid ${type} evidence`,

    source:
      "evidence-intake-certification",

    capturedAt:
      now,

    observedAt:
      now,

    contentRef:
      `evidence/${type}/${now}`,

    metadata:
      {},

    relationships:
      {},
  };
}

test(
  "all declared EvidenceTypes satisfy one universal runtime envelope",
  () => {
    for (
      const type
      of evidenceTypes
    ) {
      assert.doesNotThrow(
        () =>
          assertValidEvidenceItem(
            validEvidence(
              type,
            ),
          ),
        `${type} should satisfy the universal evidence envelope`,
      );
    }
  },
);

test(
  "Evidence Intake rejects malformed universal fields",
  () => {
    const cases:
      Array<
        [
          string,
          (
            evidence:
              Record<
                string,
                unknown
              >,
          ) => void,
          string,
        ]
      > = [
        [
          "id",
          (item) => {
            item.id = "";
          },
          "evidence_intake_invalid:id",
        ],
        [
          "type",
          (item) => {
            item.type =
              "invented-evidence-type";
          },
          "evidence_intake_invalid:type",
        ],
        [
          "title",
          (item) => {
            item.title = " ";
          },
          "evidence_intake_invalid:title",
        ],
        [
          "source",
          (item) => {
            item.source = "";
          },
          "evidence_intake_invalid:source",
        ],
        [
          "capturedAt",
          (item) => {
            item.capturedAt =
              Number.NaN;
          },
          "evidence_intake_invalid:capturedAt",
        ],
        [
          "observedAt",
          (item) => {
            item.observedAt =
              -1;
          },
          "evidence_intake_invalid:observedAt",
        ],
        [
          "temporal order",
          (item) => {
            item.observedAt =
              Number(
                item.capturedAt,
              ) +
              1;
          },
          "evidence_intake_invalid:temporal_order",
        ],
        [
          "contentRef",
          (item) => {
            item.contentRef = "";
          },
          "evidence_intake_invalid:contentRef",
        ],
        [
          "metadata",
          (item) => {
            item.metadata = [];
          },
          "evidence_intake_invalid:metadata",
        ],
        [
          "relationships",
          (item) => {
            item.relationships = [];
          },
          "evidence_intake_invalid:relationships",
        ],
        [
          "relationship refs",
          (item) => {
            item.relationships = {
              parent: [
                "",
              ],
            };
          },
          "evidence_intake_invalid:relationships.parent",
        ],
      ];

    for (
      const [
        label,
        mutate,
        expected,
      ]
      of cases
    ) {
      const item =
        {
          ...validEvidence(),
        } as unknown as
          Record<
            string,
            unknown
          >;

      mutate(
        item,
      );

      assert.throws(
        () =>
          assertValidEvidenceItem(
            item,
          ),
        (
          error:
            unknown,
        ) =>
          error instanceof
            Error &&
          error.message ===
            expected,
        label,
      );
    }
  },
);

test(
  "malformed evidence is rejected before a Manufacturing Run is created",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const before =
      platform
        .manufacturingRunService
        .list()
        .length;

    const malformed =
      {
        ...validEvidence(
          "commit",
        ),

        id:
          "",
      };

    await assert.rejects(
      platform.preserve(
        malformed,
      ),
      /evidence_intake_invalid:id/,
    );

    const after =
      platform
        .manufacturingRunService
        .list()
        .length;

    assert.equal(
      after,
      before,
      "invalid evidence must not create manufacturing state",
    );
  },
);

test(
  "documentation governance remains separate from universal evidence admission",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const incomplete =
      validEvidence(
        "document",
      );

    /*
     * Structurally valid evidence must be admitted even if
     * documentation governance metadata is incomplete.
     */
    assert.doesNotThrow(
      () =>
        assertValidEvidenceItem(
          incomplete,
        ),
    );

    const compiled =
      await platform
        .compilerPipeline
        .compile(
          incomplete,
        );

    const normalized =
      await platform
        .normalizationPipeline
        .normalize(
          compiled,
        );

    const validated =
      await platform
        .validationPipeline
        .validate(
          normalized,
        );

    assert.ok(
      validated.length >
        0,
    );

    assert.ok(
      validated.some(
        (item) =>
          item.status !==
          "approved",
      ),
      "missing governance metadata must be caught downstream, not hidden by intake",
    );
  },
);
