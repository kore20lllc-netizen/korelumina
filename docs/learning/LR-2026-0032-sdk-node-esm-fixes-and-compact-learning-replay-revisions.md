# LR-2026-0032 — SDK Node ESM fixes and compact learning replay revisions

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 08a1cba9..d7b67c4e

Source commits: 1e3a877c, d7b67c4e

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-21

Learning cycle: learning-cycle:fc7a0871a1693562 · written by the Chief Agent (gpt-5.5)

---

## Summary

The platform SDK was changed so built source loads under plain Node's ES module loader. [1e3a877c10ce6cb86eb2f1faf5476800c6943fdd] Learning replay persistence was changed to store revision data relative to a base replay when exact reconstruction is verified. [d7b67c4eb973bc6a248dd0e2ccc560314da1936e]

## What changed

- Added explicit .js extensions to two platform SDK exports so node dist/index.js can load the built SDK. (`1e3a877c`, `packages/platform-sdk/src/index.ts`, `packages/platform-sdk/src/knowledge-operations/index.ts`)
- Changed learning replay persistence to save a revision record with its base replay and materialized additions instead of always saving the whole correlation. (`d7b67c4e`, `apps/lumina-runtime/src/knowledge-preservation/genesis/GenesisHistoricalCorrelationPersistence.ts`)
- Added loading integration for revision records so the full correlation is reconstructed from the base and the revision. (`d7b67c4e`, `apps/lumina-runtime/src/knowledge-preservation/genesis/GenesisHistoricalCorrelationPersistence.ts`)
- Added genesis replay orchestration and route support for revision-based replay execution. (`d7b67c4e`, `apps/lumina-runtime/src/knowledge-preservation/genesis/GenesisReplayOrchestrator.ts`, `apps/lumina-runtime/src/routes/genesisReplayExecution.ts`)
- Added revision persistence tests and fixtures for genesis historical correlation revisions. (`d7b67c4e`, `apps/lumina-runtime/src/knowledge-preservation/genesis/__tests__/GenesisHistoricalCorrelationRevisionPersistence.test.ts`, `apps/lumina-runtime/src/knowledge-preservation/genesis/__tests__/fixtures/genesisCorrelationRevisionFixtures.ts`)

## Decisions

- The SDK uses explicit .js import specifiers because Node's ES module loader rejects directory and extensionless imports. (`1e3a877c`)
- A learning replay revision is kept only when it reproduces the full correlation exactly. (`d7b67c4e`)
- Full state is saved when revision reconstruction does not reproduce the full correlation exactly. (`d7b67c4e`)
- Missing base replays fail loudly instead of producing a partial correlation. (`d7b67c4e`)
- Revision cycles fail loudly instead of producing a partial correlation. (`d7b67c4e`)
- Revision chains deeper than 64 fail loudly instead of producing a partial correlation. (`d7b67c4e`)

## Lessons

- tsx can hide extensionless import problems that fail under Node's ES module loader. (`1e3a877c`)
- Built SDKs should be tested with plain node when Node is the runtime. (`1e3a877c`)
- Exact reconstruction checks allowed compact revision records to replace full correlation saves safely. (`d7b67c4e`)
- The revision approach loaded identically across the 35 existing learning replays checked. (`d7b67c4e`)
- The checked learning replay storage changed from 395.9 MB to 0.6 MB. (`d7b67c4e`)

## Open risks

- Revision loading depends on the designated base replay being present. (`d7b67c4e`)
- Revision chains deeper than 64 are not loaded. (`d7b67c4e`)
- Revision cycles are rejected during loading. (`d7b67c4e`)
