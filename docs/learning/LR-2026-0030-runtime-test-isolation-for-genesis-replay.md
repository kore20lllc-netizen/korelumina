# LR-2026-0030 — Runtime test isolation for Genesis replay

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: cdc172bc..8337a125

Source commits: 8337a125

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-21

Learning cycle: learning-cycle:b5b391a09e0e45b2 · written by the Chief Agent (gpt-5.5)

---

## Summary

The Genesis replay orchestrator was changed so PRODUCTION_ADMISSION tests use the injected correlation store instead of rewriting fixture correlations in real runtime-data. A new test:runtime guard runs Runtime tests and fails if runtime-data or runtime/ changes by size or mtime. 8337a125a766ecd85bb76d779baebb09b28d935c

## What changed

- GenesisReplayOrchestrator now takes the correlation store from its input to avoid saving through a store built with no root during PRODUCTION_ADMISSION replay tests. (`8337a125`, `apps/lumina-runtime/src/knowledge-preservation/genesis/GenesisReplayOrchestrator.ts`)
- Genesis historical correlation persistence was updated as part of the fix for root handling in replay correlation storage. (`8337a125`, `apps/lumina-runtime/src/knowledge-preservation/genesis/GenesisHistoricalCorrelationPersistence.ts`)
- Genesis replay tests were updated to cover the no-root case that must use the F-25 isolated temporary root. (`8337a125`, `apps/lumina-runtime/src/knowledge-preservation/genesis/__tests__/GenesisReplayOrchestrator.test.ts`)
- A new scripts/test-runtime.mjs guard runs Runtime tests and fails if runtime-data or runtime/ changes during the run. (`8337a125`, `scripts/test-runtime.mjs`)
- package.json now exposes npm run test:runtime for the Runtime test guard. (`8337a125`, `package.json`)

## Decisions

- Use the replay orchestrator input correlation store instead of constructing a store with no root, because the no-root store rewrote fixture correlations in real runtime-data. (`8337a125`, `apps/lumina-runtime/src/knowledge-preservation/genesis/GenesisReplayOrchestrator.ts`)
- Enforce Runtime test isolation by checking both size and mtime, because rewriting an existing file must be caught. (`8337a125`, `scripts/test-runtime.mjs`)
- Run every Runtime test under test:runtime, because the issue was found in Runtime test behavior rather than a single unit boundary. (`8337a125`, `package.json`, `scripts/test-runtime.mjs`)

## Lessons

- Runtime tests must not write to real runtime-data, because PRODUCTION_ADMISSION replay previously rewrote two fixture correlations on every test run. (`8337a125`)
- Injected temporary replay storage is insufficient if code paths create their own rootless persistence store. (`8337a125`, `apps/lumina-runtime/src/knowledge-preservation/genesis/GenesisReplayOrchestrator.ts`)
- A full check of 1,580 Runtime tests found this was the only write outside temporary roots. (`8337a125`)
- Size and mtime checks are needed because a rewrite of an existing file can otherwise be missed. (`8337a125`, `scripts/test-runtime.mjs`)
