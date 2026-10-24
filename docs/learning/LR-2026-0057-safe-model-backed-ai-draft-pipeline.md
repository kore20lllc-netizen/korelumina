# LR-2026-0057 — Safe model-backed AI draft pipeline

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: bfeb5684..8251973b

Source commits: 8251973b

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-23

Learning cycle: learning-cycle:c81d827b51d2cdd5 · written by the Chief Agent (gpt-5.5)

---

## Summary

Developer AI Assist drafts were changed from unsafe scripted behavior to model-backed drafts with focused context and safer patch handling. (8251973b6ba4ed44dc939c9e58200f23ced9582f) Draft apply and revert behavior now validates patches, applies drafts all-or-nothing, and refuses unsafe reverts. (8251973b6ba4ed44dc939c9e58200f23ced9582f)

## What changed

- Added a text-model draft provider so drafts come from a real model instead of only scripted behavior. (`8251973b`, `apps/lumina-runtime/src/ai/providers/TextModelDraftProvider.ts`)
- Changed draft context handling so the model sees the open file and selection first. (`8251973b`, `apps/lumina-runtime/src/ai/AIOrchestrator.ts`)
- Added patch safety checks before patches are kept and before patches are written. (`8251973b`, `apps/lumina-runtime/src/drafts/patchSafety.ts`)
- Changed draft application so a draft is applied whole or not at all. (`8251973b`, `apps/lumina-runtime/src/drafts/applyDraft.ts`)
- Changed revert behavior so it refuses to overwrite later edits made after the draft. (`8251973b`, `apps/lumina-runtime/src/drafts/revertDraft.ts`)
- Added an AI status route that tells the interface which model is in use without returning a key. (`8251973b`, `apps/lumina-runtime/src/routes/aiStatus.ts`)
- Added draft safety tests for patch application and revert protections. (`8251973b`, `apps/lumina-runtime/src/drafts/__tests__/DraftSafety.test.ts`)
- Added tests for the text-model draft provider. (`8251973b`, `apps/lumina-runtime/src/ai/__tests__/TextModelDraftProvider.test.ts`)

## Decisions

- Use a real model-backed provider for Developer AI Assist drafts because the prior Anthropic provider only threw. (`8251973b`, `apps/lumina-runtime/src/ai/providers/AnthropicProvider.ts`, `apps/lumina-runtime/src/ai/providers/TextModelDraftProvider.ts`)
- Require all-or-nothing draft application because the previous apply path could write some patches, skip others, and still mark the draft applied. (`8251973b`, `apps/lumina-runtime/src/drafts/applyDraft.ts`)
- Reject unsafe patch paths because a patch could previously pass through a symbolic link out of an imported repository. (`8251973b`, `apps/lumina-runtime/src/drafts/patchSafety.ts`)
- Do not expose provider keys through AI status because the status route is intended to return the active model without returning a key. (`8251973b`, `apps/lumina-runtime/src/routes/aiStatus.ts`)

## Lessons

- Patch application must validate all patches before writing because partial writes can leave a draft incorrectly marked as applied. (`8251973b`, `apps/lumina-runtime/src/drafts/applyDraft.ts`, `apps/lumina-runtime/src/drafts/patchSafety.ts`)
- Replacement logic must avoid changing every occurrence of matching text when only one intended patch target should change. (`8251973b`, `apps/lumina-runtime/src/drafts/applyDraft.ts`)
- Draft patch safety must account for symbolic links that can escape an imported repository. (`8251973b`, `apps/lumina-runtime/src/drafts/patchSafety.ts`, `apps/lumina-runtime/src/drafts/__tests__/DraftSafety.test.ts`)
- Revert logic must detect later edits before writing because earlier revert behavior could overwrite work done after the draft. (`8251973b`, `apps/lumina-runtime/src/drafts/revertDraft.ts`)
