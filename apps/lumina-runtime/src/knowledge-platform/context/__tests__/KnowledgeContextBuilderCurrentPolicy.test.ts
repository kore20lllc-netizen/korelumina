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

/*
 * KA-1 (F-27): retrieval "all" keeps every current-policy item even when
 * the query shares no word with it; the default still filters.
 */
test(
  "retrieval all keeps current-policy items the query does not mention",
  () => {
    const platform =
      new KnowledgePlatform();

    const item = (id: string, title: string) => ({
      id,
      type: "CandidateArtifact" as const,
      title,
      summary: "Recovered governing document.",
      confidence: 1,
      evidenceRefs: [],
      relationships: {},
      createdAt: 1,
      updatedAt: 1,
      status: "canonical" as const,
      metadata: {},
    });

    platform.store.registerGoverned(item("canonical:constitution", "Platform Constitution"));
    platform.store.registerGoverned(item("canonical:review-queue", "Canonical review queue rules"));

    const builder =
      new KnowledgeContextBuilder(
        platform,
        { list: () => platform.list() },
      );

    const query =
      "Which pending canonical review should I handle first?";

    const searched =
      builder.build({ role: "architect", objective: "question", query });

    const all =
      builder.build({ role: "architect", objective: "question", query, retrieval: "all" });

    const searchedIds =
      searched.knowledge.map((entry) => entry.id);

    const allIds =
      all.knowledge.map((entry) => entry.id);

    assert.ok(searchedIds.includes("canonical:review-queue"));
    assert.ok(
      !searchedIds.includes("canonical:constitution"),
      "the default search drops an item the query does not mention",
    );

    assert.ok(allIds.includes("canonical:review-queue"));
    assert.ok(
      allIds.includes("canonical:constitution"),
      "retrieval all keeps it",
    );
  },
);
