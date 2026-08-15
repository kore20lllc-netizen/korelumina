import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceItem,
  EvidenceType,
} from "../EvidenceItem.js";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/createKnowledgePreservationPlatform.js";

type ExpectedRoute = {
  type:
    EvidenceType;

  compiler:
    string | null;
};

const routingContract:
  readonly ExpectedRoute[] = [
    {
      type:
        "conversation",
      compiler:
        "conversation-compiler",
    },
    {
      type:
        "commit",
      compiler:
        "git-compiler",
    },
    {
      type:
        "tag",
      compiler:
        "git-compiler",
    },
    {
      type:
        "branch",
      compiler:
        "git-compiler",
    },
    {
      type:
        "ADR",
      compiler:
        "adr-compiler",
    },
    {
      type:
        "RFC",
      compiler:
        null,
    },
    {
      type:
        "document",
      compiler:
        "documentation-compiler",
    },
    {
      type:
        "source-file",
      compiler:
        "source-compiler",
    },
    {
      type:
        "runtime-event",
      compiler:
        null,
    },
    {
      type:
        "engineering-execution",
      compiler:
        null,
    },
    {
      type:
        "issue",
      compiler:
        null,
    },
    {
      type:
        "pull-request",
      compiler:
        null,
    },
    {
      type:
        "specification",
      compiler:
        null,
    },
    {
      type:
        "roadmap",
      compiler:
        null,
    },
    {
      type:
        "milestone",
      compiler:
        null,
    },
    {
      type:
        "build-output",
      compiler:
        null,
    },
    {
      type:
        "incident-log",
      compiler:
        null,
    },
  ];

function evidenceFor(
  type:
    EvidenceType,
): EvidenceItem {
  const now =
    Date.now();

  return {
    id:
      `ROUTING-${type}-${now}`,

    type,

    title:
      `Routing certification: ${type}`,

    source:
      "compiler-routing-certification",

    capturedAt:
      now,

    observedAt:
      now,

    contentRef:
      `certification/${type}/${now}`,

    metadata:
      {},

    relationships:
      {},
  };
}

test(
  "every EvidenceType has exactly its certified compiler ownership",
  () => {
    const platform =
      createKnowledgePreservationPlatform();

    for (
      const route
      of routingContract
    ) {
      const evidence =
        evidenceFor(
          route.type,
        );

      const names =
        platform
          .compilerRegistry
          .findSupportingCompilers(
            evidence,
          )
          .map(
            (compiler) =>
              compiler.name,
          );

      if (
        route.compiler ===
        null
      ) {
        assert.deepEqual(
          names,
          [],
          `${route.type} is an unsupported capability and must not enter a compiler`,
        );

        continue;
      }

      assert.deepEqual(
        names,
        [
          route.compiler,
        ],
        `${route.type} must be owned exclusively by ${route.compiler}`,
      );
    }
  },
);

test(
  "registered compilers reject every foreign evidence subtype",
  () => {
    const platform =
      createKnowledgePreservationPlatform();

    const supported =
      routingContract.filter(
        (
          route,
        ): route is {
          type:
            EvidenceType;

          compiler:
            string;
        } =>
          route.compiler !==
          null,
      );

    for (
      const owner
      of supported
    ) {
      const ownerCompiler =
        platform
          .compilerRegistry
          .findSupportingCompilers(
            evidenceFor(
              owner.type,
            ),
          )
          .find(
            (compiler) =>
              compiler.name ===
              owner.compiler,
          );

      assert.ok(
        ownerCompiler,
        `${owner.compiler} must be registered`,
      );

      for (
        const foreign
        of routingContract
      ) {
        /*
         * Git intentionally owns commit + tag + branch.
         * Those are one semantic compiler family.
         */
        const sameGitFamily =
          owner.compiler ===
            "git-compiler" &&
          foreign.compiler ===
            "git-compiler";

        if (
          foreign.type ===
            owner.type ||
          sameGitFamily
        ) {
          continue;
        }

        assert.equal(
          ownerCompiler.supports(
            evidenceFor(
              foreign.type,
            ),
          ),
          false,
          `${owner.compiler} incorrectly claims foreign evidence type ${foreign.type}`,
        );
      }
    }
  },
);

test(
  "unsupported evidence cannot accidentally acquire compiler ownership",
  () => {
    const platform =
      createKnowledgePreservationPlatform();

    const unsupported =
      routingContract.filter(
        (route) =>
          route.compiler ===
          null,
      );

    assert.ok(
      unsupported.length >
        0,
    );

    for (
      const route
      of unsupported
    ) {
      const compilers =
        platform
          .compilerRegistry
          .findSupportingCompilers(
            evidenceFor(
              route.type,
            ),
          );

      assert.equal(
        compilers.length,
        0,
        `${route.type} must remain an explicit capability gap until implemented deliberately`,
      );
    }
  },
);
