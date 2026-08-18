import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceItem,
  EvidenceType,
} from "../EvidenceItem.js";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/createKnowledgePreservationPlatform.js";

const evidenceTypes:
  readonly EvidenceType[] = [
    "conversation",
    "commit",
    "tag",
    "branch",
    "ADR",
    "RFC",
    "document",
    "source-file",
    "runtime-event",
    "engineering-execution",
    "issue",
    "pull-request",
    "specification",
    "roadmap",
    "milestone",
    "build-output",
    "incident-log",
  ];

/*
 * These are capability gaps, not valid compiler routes.
 *
 * Every item here must remain explicit. When a compiler is
 * implemented for one of these types, this test must be updated
 * in the same milestone so support cannot appear silently.
 */
const intentionallyUnsupported =
  new Set<EvidenceType>([
    "RFC",
    "runtime-event",
    "engineering-execution",
    "issue",
    "pull-request",
    "specification",
    "roadmap",
    "milestone",
    "build-output",
    "incident-log",
  ]);

function evidenceFor(
  type:
    EvidenceType,
): EvidenceItem {
  const now =
    Date.now();

  const metadata:
    Record<
      string,
      unknown
    > = {};

  /*
   * Documentation-derived evidence has an additional governed
   * intake contract. These fields are required for it to become
   * eligible for Canonical Review after compilation/validation.
   */
  if (
    type === "document" ||
    type === "specification" ||
    type === "roadmap"
  ) {
    Object.assign(
      metadata,
      {
        authorityClass:
          "Architecture",

        approvalState:
          "approved",

        owner:
          "Knowledge Operations",

        scope:
          "Evidence Intake Certification",

        version:
          "1.0.0",

        sourceLocation:
          `certification/${type}`,

        destination:
          "Canonical Knowledge",

        lineage: [
          "Knowledge Operations",
        ],

        dependencies:
          [],
      },
    );
  }

  return {
    id:
      `EVIDENCE-INTAKE-${type}-${now}`,

    type,

    title:
      `Evidence intake certification: ${type}`,

    source:
      "evidence-intake-certification",

    capturedAt:
      now,

    observedAt:
      now,

    contentRef:
      `certification/${type}`,

    metadata,

    relationships:
      {},
  };
}

test(
  "every EvidenceType has exactly one explicit intake disposition",
  () => {
    const platform =
      createKnowledgePreservationPlatform();

    const matrix =
      evidenceTypes.map(
        (type) => {
          const evidence =
            evidenceFor(
              type,
            );

          const compilers =
            platform
              .compilerRegistry
              .findSupportingCompilers(
                evidence,
              );

          return {
            type,

            compilerNames:
              compilers.map(
                (compiler) =>
                  compiler.name,
              ),

            intentionallyUnsupported:
              intentionallyUnsupported.has(
                type,
              ),
          };
        },
      );

    console.table(
      matrix,
    );

    for (
      const entry
      of matrix
    ) {
      const supported =
        entry.compilerNames.length >
        0;

      const unsupported =
        entry.intentionallyUnsupported;

      assert.notEqual(
        supported,
        unsupported,
        `${entry.type} must be either compiler-supported OR explicitly unsupported, never both/neither`,
      );

      if (
        supported
      ) {
        assert.equal(
          entry.compilerNames.length,
          1,
          `${entry.type} must route to exactly one compiler capability`,
        );
      }
    }
  },
);

test(
  "every supported evidence format compiles with preserved provenance",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    for (
      const type
      of evidenceTypes
    ) {
      const evidence =
        evidenceFor(
          type,
        );

      const compilers =
        platform
          .compilerRegistry
          .findSupportingCompilers(
            evidence,
          );

      if (
        compilers.length ===
        0
      ) {
        continue;
      }

      assert.equal(
        compilers.length,
        1,
        `${type} has ambiguous compiler ownership`,
      );

      const [
        compiler,
      ] =
        compilers;

      const items =
        await compiler.compile(
          evidence,
        );

      assert.ok(
        items.length >
        0,
        `${type}/${compiler.name} claims support but emits no Knowledge IR`,
      );

      for (
        const item
        of items
      ) {
        assert.ok(
          item.evidenceRefs.includes(
            evidence.id,
          ),
          `${type}/${compiler.name} lost evidence provenance`,
        );

        assert.equal(
          item.compiler.compilerName,
          compiler.name,
          `${type} emitted incorrect compiler attribution`,
        );

        assert.equal(
          item.compiler.evidenceSourceType,
          evidence.type,
          `${type} emitted incorrect source-type attribution`,
        );
      }
    }
  },
);

test(
  "documentation-governed intake metadata survives into validation",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    for (
      const type
      of [
        "document",
        "specification",
        "roadmap",
      ] as const
    ) {
      const evidence =
        evidenceFor(
          type,
        );

      const compilers =
        platform
          .compilerRegistry
          .findSupportingCompilers(
            evidence,
          );

      /*
       * Only enforce governance for documentation evidence types
       * actually owned by the current Documentation compiler.
       */
      if (
        compilers.length ===
        0
      ) {
        continue;
      }

      const compiled =
        await platform
          .compilerPipeline
          .compile(
            evidence,
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
        `${type} produced no validated Knowledge IR`,
      );

      for (
        const item
        of validated
      ) {
        assert.equal(
          item.status,
          "approved",
          `${type} valid governed intake did not validate as approved`,
        );
      }
    }
  },
);
