import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgePlatform,
} from "../../KnowledgePlatform.js";

import {
  KnowledgeContextBuilder,
} from "../KnowledgeContextBuilder.js";


test(
  "KnowledgeContextBuilder excludes canonical items absent from current-policy view",
  () => {
    const platform =
      new KnowledgePlatform();

    platform.store.registerGoverned({
      id:
        "canonical:allowed",

      type:
        "CandidateDecision",

      title:
        "Allowed",

      summary:
        "Current policy allowed",

      confidence:
        1,

      evidenceRefs:
        [],

      relationships:
        {},

      createdAt:
        1,

      updatedAt:
        1,

      status:
        "canonical",

      metadata:
        {},
    });

    platform.store.registerGoverned({
      id:
        "canonical:drift",

      type:
        "CandidateDecision",

      title:
        "Drift",

      summary:
        "Policy drift",

      confidence:
        1,

      evidenceRefs:
        [],

      relationships:
        {},

      createdAt:
        1,

      updatedAt:
        1,

      status:
        "canonical",

      metadata:
        {},
    });

    const builder =
      new KnowledgeContextBuilder(
        platform,

        {
          list:
            () => [
              platform.store.get(
                "canonical:allowed",
              )!,
            ],
        },
      );

    const unfiltered =
      platform.list();

    assert.equal(
      unfiltered.length,
      2,
    );

    const context =
      builder.build({
        role:
          "architect",

        objective:
          "reason",

        maxKnowledgeItems:
          10,
      });

    assert.deepEqual(
      context.knowledge.map(
        item =>
          item.id,
      ),
      [
        "canonical:allowed",
      ],
    );
  },
);


test(
  "KnowledgeContextBuilder query results are intersected with current-policy view",
  () => {
    const platform =
      new KnowledgePlatform();

    platform.store.registerGoverned({
      id:
        "canonical:allowed",

      type:
        "CandidateDecision",

      title:
        "Architecture allowed",

      summary:
        "Architecture",

      confidence:
        1,

      evidenceRefs:
        [],

      relationships:
        {},

      createdAt:
        1,

      updatedAt:
        1,

      status:
        "canonical",

      metadata:
        {},
    });

    platform.store.registerGoverned({
      id:
        "canonical:drift",

      type:
        "CandidateDecision",

      title:
        "Architecture drift",

      summary:
        "Architecture",

      confidence:
        1,

      evidenceRefs:
        [],

      relationships:
        {},

      createdAt:
        1,

      updatedAt:
        1,

      status:
        "canonical",

      metadata:
        {},
    });

    const allowed =
      platform.store.get(
        "canonical:allowed",
      )!;

    const builder =
      new KnowledgeContextBuilder(
        platform,

        {
          list:
            () => [
              allowed,
            ],
        },
      );

    const context =
      builder.build({
        role:
          "architect",

        objective:
          "reason",

        query:
          "Architecture",

        maxKnowledgeItems:
          10,
      });

    assert.deepEqual(
      context.knowledge.map(
        item =>
          item.id,
      ),
      [
        "canonical:allowed",
      ],
    );
  },
);
