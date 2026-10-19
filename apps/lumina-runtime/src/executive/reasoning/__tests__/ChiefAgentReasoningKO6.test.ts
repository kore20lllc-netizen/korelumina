import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createExecutiveContext } from "../../context/index.js";
import { createExecutiveEvent } from "../../events/index.js";
import {
  RegistryExecutiveDispatcher,
  type ExecutiveDispatchContext,
} from "../../orchestrator/index.js";
import { ChiefAgentGovernedContentReader } from "../ChiefAgentGovernedContentReader.js";
import { ChiefAgentReasoningDestinationAdapter } from "../ChiefAgentReasoningDestinationAdapter.js";
import type { ChiefAgentReasoningInput } from "../ChiefAgentReasoningDestinationAdapter.js";
import { ExecutiveReasoningService } from "../ExecutiveReasoningService.js";
import { FileExecutiveReasoningStore } from "../FileExecutiveReasoningStore.js";
import { resolveExecutiveStorageRoot } from "../../storage/resolveExecutiveStorageRoot.js";

function sha(text: string) {
  return `sha256:${crypto.createHash("sha256").update(text).digest("hex")}`;
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ko6-"));
}

function item(id: string, contentRef?: string, checksum?: string) {
  return {
    id,
    type: "document",
    title: id,
    summary: "Approved documentation evidence.",
    confidence: 1,
    evidenceRefs: [],
    relationships: {},
    createdAt: 1,
    updatedAt: 1,
    status: "canonical",
    metadata: { ...(contentRef ? { contentRef } : {}), ...(checksum ? { checksum } : {}) },
  } as never;
}

const emptyMaterializer = {
  materialize: () => ({ canonicalKnowledge: [], organizationalMemory: [] }),
} as never;

function dispatchContext(actorType: string, actorId: string, payload: Record<string, unknown> = {}) {
  return {
    event: createExecutiveEvent({
      id: `event:${actorType}`,
      type: "business.question",
      category: "business",
      source: actorId,
      actor: { id: actorId, type: actorType as never },
      confidence: "medium",
      payload: { query: "customer risk", ...payload },
    }),
    context: createExecutiveContext(),
  } as unknown as ExecutiveDispatchContext;
}

test("includes certified content only when the file still matches its checksum", () => {
  const root = tempRoot();
  fs.mkdirSync(path.join(root, "docs"));
  fs.writeFileSync(path.join(root, "docs", "charter.md"), "Customers own their software.");
  fs.writeFileSync(path.join(root, "docs", "changed.md"), "edited after certification");

  const reader = new ChiefAgentGovernedContentReader(root);
  const result = reader.read([
    item("charter", "docs/charter.md", sha("Customers own their software.")),
    item("changed", "docs/changed.md", sha("original text")),
    item("missing", "docs/missing.md", sha("x")),
    item("unchecked", "docs/charter.md"),
    item("section", "docs/charter.md#section:a", sha("x")),
    item("escape", "../outside.md", sha("x")),
    item("summary-only"),
  ]);

  assert.deepEqual(result.included.map((e) => e.id), ["charter"]);
  assert.equal(result.included[0].content, "Customers own their software.");
  assert.deepEqual(
    Object.fromEntries(result.excluded.map((e) => [e.id, e.reason])),
    {
      changed: "content_changed_since_certification",
      missing: "content_missing",
      unchecked: "content_checksum_missing",
      section: "content_ref_not_a_repository_file",
      escape: "content_ref_not_a_repository_file",
    },
  );
});

test("ranks content by the question and stops at the budget", () => {
  const root = tempRoot();
  const files: Record<string, string> = {
    "a.md": "architecture ".repeat(10),
    "b.md": "customer billing risk ".repeat(10),
    "c.md": "customer ".repeat(10),
  };
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(root, name), text);

  const reader = new ChiefAgentGovernedContentReader(root, { maxItemChars: 150, maxTotalChars: 240 });
  const result = reader.read(
    Object.entries(files).map(([name, text]) => item(name, name, sha(text))),
    "customer billing risk",
  );

  assert.deepEqual(result.included.map((e) => e.id), ["b.md", "c.md"]);
  assert.equal(result.included[0].truncated, true);
  assert.deepEqual(result.excluded, [{ id: "a.md", reason: "context_budget_reached" }]);
});

test("reasons on a person's request and sends the proposal to them for approval", async () => {
  let received: ChiefAgentReasoningInput | undefined;
  const adapter = new ChiefAgentReasoningDestinationAdapter(emptyMaterializer, {
    reason: async (input) => {
      received = input;
      return { title: "t", disposition: "review", conclusion: "c", confidence: 0.7, evidence: [], assumptions: [] };
    },
  });

  await adapter.handle(dispatchContext("human", "human:founder"));
  assert.equal(received?.approverId, "human:founder");
  assert.equal(received?.query, "customer risk");

  await adapter.handle(dispatchContext("human", "human:founder", { approverId: "human:reviewer" }));
  assert.equal(received?.approverId, "human:reviewer");
});

test("events from other actors are recorded as skipped, not handled", async () => {
  let calls = 0;
  const dispatcher = new RegistryExecutiveDispatcher();
  const adapter = new ChiefAgentReasoningDestinationAdapter(emptyMaterializer, {
    reason: async () => {
      calls += 1;
      return { title: "t", disposition: "review", conclusion: "c", confidence: 0.7, evidence: [], assumptions: [] };
    },
  });
  dispatcher.register("reasoning", (context) => adapter.handle(context));

  const context = dispatchContext("runtime", "runtime:1");
  const result = await dispatcher.dispatch({
    ...context,
    route: { eventId: context.event.id, destinations: ["reasoning"], reason: "test" },
  } as never);

  assert.equal(calls, 0);
  assert.equal(result.records[0].status, "skipped");
  assert.equal(result.records[0].message, "chief_agent_reasoning_not_requested_by_actor_type:runtime");
  assert.equal(result.successful, true);
});

test("a missing provider is skipped, not silently handled", async () => {
  const adapter = new ChiefAgentReasoningDestinationAdapter(emptyMaterializer);
  await assert.rejects(
    adapter.handle(dispatchContext("human", "human:founder")),
    /chief_agent_reasoning_provider_not_configured/,
  );
});

test("reasoning survives a restart when a store is configured", () => {
  const root = tempRoot();
  const store = new FileExecutiveReasoningStore(() => root);
  const first = new ExecutiveReasoningService(undefined, store);
  first.create({
    id: "reasoning:r1",
    sessionId: "r1",
    title: "Title",
    question: "Q",
    conclusion: "C",
    disposition: "review",
    confidence: 0.8,
  });

  const second = new ExecutiveReasoningService(undefined, store);
  assert.equal(second.get("reasoning:r1")?.conclusion, "C");
  assert.equal(second.updateStatus("reasoning:r1", "superseded").status, "superseded");
  assert.equal(new ExecutiveReasoningService(undefined, store).get("reasoning:r1")?.status, "superseded");
  assert.equal(second.list().length, 1);
});

test("executive records go to the configured root", () => {
  const previous = process.env.KORELUMINA_EXECUTIVE_ROOT;
  process.env.KORELUMINA_EXECUTIVE_ROOT = "/tmp/ko6-exec";
  try {
    assert.equal(resolveExecutiveStorageRoot(), "/tmp/ko6-exec");
  } finally {
    if (previous === undefined) delete process.env.KORELUMINA_EXECUTIVE_ROOT;
    else process.env.KORELUMINA_EXECUTIVE_ROOT = previous;
  }
  /* F-25: unconfigured, a test process gets its own temporary directory. */
  const isolated = resolveExecutiveStorageRoot();
  assert.ok(isolated.startsWith(os.tmpdir()), isolated);
  assert.ok(!isolated.startsWith(process.cwd()), isolated);
});
