# LR-2026-0022 — Backfill mission links after approval

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: fb3556db..39bd41f8

Source commits: 39bd41f8

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-20

Learning cycle: learning-cycle:6fe5a970c865bf8b · written by the Chief Agent (gpt-5.5)

---

## Summary

Mission work linking was fixed so commits learned before mission approval can link after approval, honoring ADR-0044 Decision 3 (39bd41f8fbee8a18e1891021673a045f1a3f99c3). The fix prevents late links from moving the recovery anchor backward and adds coverage for mission work linking behavior (39bd41f8fbee8a18e1891021673a045f1a3f99c3).

## What changed

- Commits from earlier captured cycles now link to their mission after the mission is approved. (`39bd41f8`, `apps/lumina-runtime/src/executive/mission/MissionWorkLinker.ts`)
- Backfilled mission links are processed oldest first. (`39bd41f8`, `apps/lumina-runtime/src/executive/mission/MissionWorkLinker.ts`)
- Backfilled mission links retain the cycle they came from and its Learning Record. (`39bd41f8`, `apps/lumina-runtime/src/executive/mission/MissionWorkLinker.ts`)
- Held or failed windows still link no commits to missions. (`39bd41f8`, `apps/lumina-runtime/src/executive/mission/MissionWorkLinker.ts`)
- Mission work linking now avoids linking the same commit twice. (`39bd41f8`, `apps/lumina-runtime/src/executive/mission/MissionWorkLinker.ts`)
- The recovery anchor is now always the newest linked commit. (`39bd41f8`, `apps/lumina-runtime/src/continuous-learning/ContinuousLearningLedger.ts`)
- Mission work linking tests were expanded. (`39bd41f8`, `apps/lumina-runtime/src/executive/mission/__tests__/MissionWorkLinking.test.ts`)

## Decisions

- The implementation follows ADR-0044 Decision 3 that a commit with a Mission trailer belongs to that mission. (`39bd41f8`)
- Mission linking was moved beyond only the cycle that learned the commit because that prior behavior could permanently ignore commits learned while their mission was still planned. (`39bd41f8`)
- The recovery anchor uses the newest linked commit so a late link cannot move it backward. (`39bd41f8`, `apps/lumina-runtime/src/continuous-learning/ContinuousLearningLedger.ts`)

## Lessons

- The old link-only-when-learned behavior failed for F-33 because commit 49af80ff with Mission MS-2026-0005 was learned while the mission was still planned. (`39bd41f8`)
- The ignored F-33 commit could never link, so its mission could not start or complete. (`39bd41f8`)
- Checking the owner's real ledger showed only MS-2026-0005 changed, starting from 49af80ff. (`39bd41f8`)
- The runtime suites passed at 1574/1574 after the fix. (`39bd41f8`)
