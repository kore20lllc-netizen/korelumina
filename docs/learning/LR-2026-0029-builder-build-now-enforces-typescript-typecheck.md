# LR-2026-0029 — Builder build now enforces TypeScript typecheck

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 97457ee1..c3c582f5

Source commits: c3c582f5

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-21

Learning cycle: learning-cycle:4a05123bc4b4f147 · written by the Chief Agent (gpt-5.5)

---

## Summary

The builder build was changed so `npm run build` runs `typecheck:builder` before building, after `vite build` had allowed TypeScript errors to accumulate. The final cleanup removed stale tests and superseded v1 Knowledge Operations files, leaving the builder typecheck clean. Sources: c3c582f512370fefb9127a45028d8e013d89eb86, package.json.

## What changed

- `npm run build` now runs `typecheck:builder` before the build so a type error stops the build. (`c3c582f5`, `package.json`)
- The builder typecheck was cleaned from an initial backlog of 384 TypeScript errors. (`c3c582f5`)
- The last 13 TypeScript errors were stale tests and outdated fixtures. (`c3c582f5`)
- Tests for modules deleted in `0ea2a288` were removed. (`c3c582f5`, `apps/lumina-builder/src/__tests__/services.test.ts`)
- Genesis test fixtures were updated because they predated newer projection fields. (`c3c582f5`, `apps/lumina-builder/src/components/workspaces/genesis/__tests__/GenesisOperationalProjectionPanel.test.tsx`, `apps/lumina-builder/src/components/workspaces/genesis/__tests__/GenesisHistoricalArtifactExplorer.test.tsx`)
- Runtime Genesis tests were updated while clearing stale type errors. (`c3c582f5`, `apps/lumina-builder/src/services/runtime/__tests__/genesisOperationalReadController.test.ts`, `apps/lumina-builder/src/services/runtime/__tests__/genesisOperationalReadState.test.ts`)
- The superseded v1 Knowledge Operations workspace file was removed. (`c3c582f5`, `apps/lumina-builder/src/components/workspaces/KnowledgeOperationsWorkspace.tsx`)
- The superseded v1 Knowledge Operations layout files were removed. (`c3c582f5`, `apps/lumina-builder/src/components/workspaces/knowledge/layout/KnowledgeWorkspaceRegions.tsx`, `apps/lumina-builder/src/components/workspaces/knowledge/layout/index.ts`)

## Decisions

- The build was changed to run `typecheck:builder` before `vite build` because `vite build` did not run `tsc`. (`c3c582f5`, `package.json`)
- The two superseded v1 Knowledge Operations files were removed because they were unreachable from `main.tsx` and owner approval was given. (`c3c582f5`, `apps/lumina-builder/src/components/workspaces/KnowledgeOperationsWorkspace.tsx`, `apps/lumina-builder/src/components/workspaces/knowledge/layout/KnowledgeWorkspaceRegions.tsx`)

## Lessons

- Do not rely on `vite build` alone for TypeScript safety because it allowed 384 builder type errors to accumulate unseen. (`c3c582f5`)
- Keep tests aligned with deleted modules because stale tests contributed to the final builder type errors. (`c3c582f5`, `apps/lumina-builder/src/__tests__/services.test.ts`)
- Keep Genesis fixtures aligned with projection field changes because outdated fixtures contributed to the final builder type errors. (`c3c582f5`, `apps/lumina-builder/src/components/workspaces/genesis/__tests__/GenesisOperationalProjectionPanel.test.tsx`, `apps/lumina-builder/src/components/workspaces/genesis/__tests__/GenesisHistoricalArtifactExplorer.test.tsx`)
- Avoid `as any` access to fields that may no longer exist because one such access contributed to the final builder type errors. (`c3c582f5`)

## Open risks

- No open follow-up was stated in the provided commit evidence. (`c3c582f5`)
