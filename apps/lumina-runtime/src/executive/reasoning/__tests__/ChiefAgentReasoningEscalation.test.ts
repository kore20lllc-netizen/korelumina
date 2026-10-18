import assert from "node:assert/strict";
import test from "node:test";

import {
  EscalatingChiefAgentReasoningProvider,
  createChiefAgentReasoningProvider,
  createTextGenerationClient,
  resolveChiefAgentReasoningRouting,
  type ChiefAgentReasoningInput,
  type ChiefAgentReasoningProvider,
  type ChiefAgentReasoningResult,
} from "../index.js";

import type {
  TextGenerationClient,
} from "../../../ai/model/index.js";

const input = {
  eventId: "event:escalation:test",
  eventType: "chief-agent.reason",
  query: "Which architecture should we follow?",
  knowledge: {
    canonicalKnowledge: [
      {
        id: "canonical:architecture",
        type: "CandidatePrinciple" as const,
        title: "Architecture",
        summary: "Canonical architecture guidance.",
        confidence: 1,
        evidenceRefs: [],
        relationships: {},
        createdAt: 1,
        updatedAt: 1,
        status: "canonical" as const,
        metadata: {},
      },
    ],
    organizationalMemory: [],
  },
} as unknown as ChiefAgentReasoningInput;

function result(confidence: number, model: string): ChiefAgentReasoningResult {
  return {
    title: "Follow the canonical architecture",
    disposition: "review",
    conclusion: "Use the governed architecture.",
    confidence,
    evidence: ["canonical:architecture"],
    assumptions: [],
    metadata: { model },
  };
}

function provider(
  behaviour: () => ChiefAgentReasoningResult,
): ChiefAgentReasoningProvider & { calls: number } {
  const p = {
    calls: 0,
    async reason() {
      p.calls += 1;
      return behaviour();
    },
  };
  return p;
}

const failing = (message: string) =>
  provider(() => {
    throw new Error(message);
  });

test(
  "a confident primary answer is returned without escalating",
  async () => {
    const primary = provider(() => result(0.9, "small"));
    const strong = provider(() => result(0.95, "frontier"));
    const routed = await new EscalatingChiefAgentReasoningProvider(
      { name: "openai-compatible", provider: primary },
      { name: "anthropic", provider: strong },
      0.6,
    ).reason(input);

    assert.equal(strong.calls, 0);
    assert.equal(routed.metadata?.model, "small");
    const routing = routed.metadata?.routing as Record<string, unknown>;
    assert.equal(routing.escalated, false);
    assert.equal(routing.escalationReason, null);
  },
);

test(
  "low confidence escalates to the stronger model and records both attempts",
  async () => {
    const routed = await new EscalatingChiefAgentReasoningProvider(
      { name: "openai-compatible", provider: provider(() => result(0.3, "small")) },
      { name: "anthropic", provider: provider(() => result(0.92, "frontier")) },
      0.6,
    ).reason(input);

    assert.equal(routed.metadata?.model, "frontier");
    assert.equal(routed.confidence, 0.92);
    const routing = routed.metadata?.routing as {
      escalated: boolean;
      escalationReason: string;
      attempts: Array<{ role: string; model: string | null; confidence: number | null }>;
    };
    assert.equal(routing.escalated, true);
    assert.equal(routing.escalationReason, "low-confidence");
    assert.deepEqual(
      routing.attempts.map((a) => [a.role, a.model, a.confidence]),
      [["primary", "small", 0.3], ["escalation", "frontier", 0.92]],
    );
  },
);

test(
  "a failed or unusable primary answer escalates",
  async () => {
    const routed = await new EscalatingChiefAgentReasoningProvider(
      { name: "openai", provider: failing("chief_agent_reasoning_invalid_json") },
      { name: "anthropic", provider: provider(() => result(0.8, "frontier")) },
      0.6,
    ).reason(input);

    const routing = routed.metadata?.routing as { escalationReason: string; attempts: Array<{ error: string | null }> };
    assert.equal(routing.escalationReason, "primary-failed");
    assert.equal(routing.attempts.at(0)?.error, "chief_agent_reasoning_invalid_json");
  },
);

test(
  "without an escalation model, low confidence is returned flagged and failures still fail",
  async () => {
    const low = await new EscalatingChiefAgentReasoningProvider(
      { name: "openai", provider: provider(() => result(0.2, "small")) },
      null,
      0.6,
    ).reason(input);

    const routing = low.metadata?.routing as Record<string, unknown>;
    assert.equal(routing.escalated, false);
    assert.equal(routing.escalationReason, "low-confidence");
    assert.equal(routing.escalationAvailable, false);

    await assert.rejects(
      new EscalatingChiefAgentReasoningProvider(
        { name: "openai", provider: failing("missing_OPENAI_API_KEY") },
        null,
        0.6,
      ).reason(input),
      { message: "missing_OPENAI_API_KEY" },
    );
  },
);

test(
  "if escalation fails, a usable primary answer is kept and two failures are reported together",
  async () => {
    const kept = await new EscalatingChiefAgentReasoningProvider(
      { name: "openai", provider: provider(() => result(0.4, "small")) },
      { name: "anthropic", provider: failing("anthropic_request_failed") },
      0.6,
    ).reason(input);

    assert.equal(kept.metadata?.model, "small");
    assert.equal((kept.metadata?.routing as Record<string, unknown>).escalationFailed, true);

    await assert.rejects(
      new EscalatingChiefAgentReasoningProvider(
        { name: "openai", provider: failing("p_down") },
        { name: "anthropic", provider: failing("e_down") },
        0.6,
      ).reason(input),
      { message: "chief_agent_reasoning_failed: primary=p_down; escalation=e_down" },
    );
  },
);

test(
  "routing defaults keep today's behaviour and invalid settings fall back safely",
  () => {
    assert.deepEqual(resolveChiefAgentReasoningRouting({}), {
      primary: "openai",
      primaryModel: null,
      escalation: null,
      escalationModel: null,
      confidenceThreshold: 0.6,
    });

    assert.deepEqual(
      resolveChiefAgentReasoningRouting({
        LUMINA_REASONING_PRIMARY: " OpenAI-Compatible ",
        LUMINA_REASONING_PRIMARY_MODEL: "qwen2.5-coder:7b",
        LUMINA_REASONING_ESCALATION: "Anthropic",
        LUMINA_REASONING_ESCALATION_MODEL: "claude-sonnet-5-5",
        LUMINA_REASONING_ESCALATION_CONFIDENCE: "0.75",
      }),
      {
        primary: "openai-compatible",
        primaryModel: "qwen2.5-coder:7b",
        escalation: "anthropic",
        escalationModel: "claude-sonnet-5-5",
        confidenceThreshold: 0.75,
      },
    );

    assert.equal(resolveChiefAgentReasoningRouting({ LUMINA_REASONING_ESCALATION_CONFIDENCE: "7" }).confidenceThreshold, 0.6);
    assert.equal(resolveChiefAgentReasoningRouting({ LUMINA_REASONING_ESCALATION: "none" }).escalation, null);
  },
);

test(
  "an unknown provider name fails reasoning visibly instead of crashing the runtime",
  async () => {
    await assert.rejects(
      createTextGenerationClient("mystery", null).generateText({ prompt: "x" }),
      { message: "unsupported_reasoning_provider:mystery" },
    );
  },
);

test(
  "configured routing runs end to end through the real reasoning parser with pinned models",
  async () => {
    const seen: Array<[string, string | undefined]> = [];
    const answer = (confidence: number) =>
      JSON.stringify({
        title: "Follow the canonical architecture",
        disposition: "review",
        conclusion: "Use the governed architecture.",
        confidence,
        evidence: ["canonical:architecture"],
        assumptions: [],
      });

    const makeClient = (name: string, model: string | null): TextGenerationClient => ({
      async generateText(request) {
        const chosen = request.model ?? model ?? undefined;
        seen.push([name, chosen]);
        return { text: answer(name === "openai-compatible" ? 0.3 : 0.9), model: chosen ?? name };
      },
    });

    const reasoned = await createChiefAgentReasoningProvider(
      {
        primary: "openai-compatible",
        primaryModel: "qwen2.5-coder:7b",
        escalation: "anthropic",
        escalationModel: "claude-sonnet-5-5",
        confidenceThreshold: 0.6,
      },
      makeClient,
    ).reason(input);

    assert.deepEqual(seen, [
      ["openai-compatible", "qwen2.5-coder:7b"],
      ["anthropic", "claude-sonnet-5-5"],
    ]);
    assert.equal(reasoned.confidence, 0.9);
    assert.equal((reasoned.metadata?.routing as Record<string, unknown>).escalated, true);
  },
);
