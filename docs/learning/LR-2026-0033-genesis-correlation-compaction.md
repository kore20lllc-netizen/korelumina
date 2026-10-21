# LR-2026-0033 — Genesis correlation compaction

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: d7b67c4e..f2fc156f

Source commits: f2fc156f

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-21

Learning cycle: learning-cycle:d847be9ae8c2ac43 · written by the Chief Agent (gpt-5.5)

---

## Summary

This work added genesis historical correlation compaction that previews by default and converts eligible full correlation copies to revision records only with --write [f2fc156fd32d2b5d268fe1c0a5d9bd36b021cd73]. The compaction path backs up originals, verifies reproduction, reloads converted records, and leaves designated replays and non-reproducible copies unchanged [f2fc156fd32d2b5d268fe1c0a5d9bd36b021cd73].

## What changed

- Added GenesisHistoricalCorrelationCompaction for compacting historical correlation records. (`apps/lumina-runtime/src/knowledge-preservation/genesis/GenesisHistoricalCorrelationCompaction.ts`, `f2fc156f`)
- Added a compactHistoricalCorrelations CLI for genesis correlation compaction. (`apps/lumina-runtime/src/knowledge-preservation/genesis/cli/compactHistoricalCorrelations.ts`, `f2fc156f`)
- Added npm script support for running genesis:compact-correlations. (`apps/lumina-runtime/package.json`, `package.json`, `f2fc156f`)
- Added tests for GenesisHistoricalCorrelationCompaction. (`apps/lumina-runtime/src/knowledge-preservation/genesis/__tests__/GenesisHistoricalCorrelationCompaction.test.ts`, `f2fc156f`)
- Exported the genesis compaction functionality from the genesis index. (`apps/lumina-runtime/src/knowledge-preservation/genesis/index.ts`, `f2fc156f`)
- The compaction command converts a full copy only when an earlier replay plus the copy's replay materializes the same result exactly. (`f2fc156f`)
- The store reloads every converted record and compares it after conversion. (`f2fc156f`)
- The original full copy is backed up before conversion. (`f2fc156f`)

## Decisions

- The command previews by default instead of writing changes. (`f2fc156f`)
- The command writes conversions only when run with --write. (`f2fc156f`)
- The designated replay is never rewritten. (`f2fc156f`)
- Copies with no reproducing base are never rewritten. (`f2fc156f`)

## Lessons

- A rehearsal on a copy of the owner's runtime-data converted 41 correlations. (`f2fc156f`)
- The rehearsal reduced correlation data from 496.5 MB to 51.4 MB. (`f2fc156f`)
- All 56 correlations loaded identically after the rehearsal. (`f2fc156f`)
- A second run after the rehearsal converted nothing. (`f2fc156f`)
