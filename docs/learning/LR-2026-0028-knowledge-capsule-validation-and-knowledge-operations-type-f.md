# LR-2026-0028 — Knowledge capsule validation and Knowledge Operations type fixes

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 29ce4db4..97457ee1

Source commits: 97457ee1

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-21

Learning cycle: learning-cycle:58d8b9ddf7809e9d · written by the Chief Agent (gpt-5.5)

---

## Summary

The work fixed Knowledge Capsule Inspector validation by treating healthy layers as validated instead of comparing against a nonexistent validated status, which had made validation appear partial. The work also removed unused props and dead references across Knowledge Operations while preserving the approved visual contract. Citations: 97457ee125cc6ed98b4d210ad4e27b042c46bdaf

## What changed

- KnowledgeCapsuleInspector now treats healthy layers as validated because layer states are healthy, warning, or failed rather than validated. (`97457ee1`, `apps/lumina-builder/src/components/workspaces/knowledge/production/capsules/KnowledgeCapsuleInspector.tsx`)
- The capsule inspector no longer counts every layer as an exception due to the invalid validated-status check. (`97457ee1`, `apps/lumina-builder/src/components/workspaces/knowledge/production/capsules/KnowledgeCapsuleInspector.tsx`)
- Unused panel emphasis props, metric-grid columns props, as={undefined} surface props, and dead appearance references were removed with no intended visual change. (`97457ee1`, `apps/lumina-builder/src/components/workspaces/knowledge-v3/layout/ExecutiveMetricCard.tsx`, `apps/lumina-builder/src/components/workspaces/knowledge-v3/layout/ExecutiveOperationsDeck.tsx`, `apps/lumina-builder/src/components/workspaces/knowledge/learning/states/EducationalStateSurface.tsx`)
- Panels without titles now pass title={null}. (`97457ee1`)
- Empty starting summaries now carry their newer fields. (`97457ee1`, `apps/lumina-builder/src/components/workspaces/knowledge/production/data/organizationalMemoryProjection.ts`)
- KnowledgeCapsuleModel was aliased to KnowledgeCapsule. (`97457ee1`, `apps/lumina-builder/src/components/workspaces/knowledge/production/capsules/KnowledgeCapsuleFlowEngine.tsx`)
- ExecutivePremiumIcon now accepts Knowledge Operations SVG icons. (`97457ee1`, `apps/lumina-builder/src/components/design-system/executive/ExecutivePremiumIcon.tsx`)
- The executive ribbon imports its metric type. (`97457ee1`, `apps/lumina-builder/src/components/workspaces/knowledge-v3/layout/ExecutiveRibbon.metrics.ts`)
- An always-false conversation filter check was removed. (`97457ee1`)

## Decisions

- Healthy was chosen as the validated layer condition because the lifecycle states are healthy, warning, and failed. (`97457ee1`, `apps/lumina-builder/src/components/workspaces/knowledge/production/capsules/lifecycle.ts`, `apps/lumina-builder/src/components/workspaces/knowledge/production/capsules/KnowledgeCapsuleInspector.tsx`)
- The Knowledge Operations contract was re-certified after owner visual approval. (`97457ee1`)
- Type fixes were limited to changes with no visual impact except for the described capsule inspector correction. (`97457ee1`)

## Lessons

- Validation logic must compare against actual lifecycle states; comparing against validated made every capsule layer read as partial and rose. (`97457ee1`, `apps/lumina-builder/src/components/workspaces/knowledge/production/capsules/lifecycle.ts`, `apps/lumina-builder/src/components/workspaces/knowledge/production/capsules/KnowledgeCapsuleInspector.tsx`)
- Visual approval and pixel comparison were useful for separating type-only fixes from visible product changes. (`97457ee1`)
- Seven files were pixel-identical after the Knowledge Operations type fixes. (`97457ee1`)
- The capsule inspector was the only certified visual change described in the work. (`97457ee1`, `apps/lumina-builder/src/components/workspaces/knowledge/production/capsules/KnowledgeCapsuleInspector.tsx`)

## Open risks

- Live code typechecks, but 15 errors remain in tests. (`97457ee1`)
- Two never-loaded v1 files still have typecheck errors. (`97457ee1`)
