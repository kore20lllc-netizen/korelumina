# LR-2026-0004 — Windowed learning skips uncommitted documents

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 3cdbbd5c..d7cbbd72

Source commits: d7cbbd72

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-19

Learning cycle: learning-cycle:6df165322d038b40 · written by the Chief Agent (gpt-5.5)

---

## Summary

Windowed Genesis manifest building was changed so uncommitted documents do not block continuous-learning captures, while full Genesis replays still treat them as errors (d7cbbd7251535f3e49a34284fb0d9304f9f001da). This addressed LR-2026-0001 not being admitted or promoted because Runtime-written Learning Records lacked git timestamps before commit (d7cbbd7251535f3e49a34284fb0d9304f9f001da).

## What changed

- Windowed learning cycles now leave uncommitted documents out of the window. (`d7cbbd72`, `apps/lumina-runtime/src/continuous-learning/WindowedGenesisManifestBuilder.ts`)
- Uncommitted documents are learned once they are committed. (`d7cbbd72`)
- Tests were updated for uncommitted document handling in the windowed Genesis manifest builder. (`apps/lumina-runtime/src/continuous-learning/__tests__/WindowedGenesisManifestBuilder.test.ts`, `d7cbbd72`)

## Decisions

- The fix applies to learning cycles rather than full Genesis replays. (`d7cbbd72`)
- Full Genesis replays still treat uncommitted documents as an error. (`d7cbbd72`)
- The reason for excluding uncommitted documents from windowed cycles was that a Runtime-written Learning Record has no git timestamp until committed. (`d7cbbd72`)

## Lessons

- Windowed capture should not fail solely because a Runtime-written Learning Record has no git timestamp before commit. (`d7cbbd72`)
- Treating an uncommitted Runtime-written Learning Record as a discovery error blocked the whole capture. (`d7cbbd72`)
- The previous behavior prevented LR-2026-0001 from being admitted or promoted. (`d7cbbd72`)

## Open risks

- Uncommitted documents are not learned by windowed cycles until they are committed. (`d7cbbd72`)
- Full Genesis replays can still error on uncommitted documents. (`d7cbbd72`)
