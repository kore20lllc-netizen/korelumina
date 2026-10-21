# LR-2026-0031 — Build shared packages from source

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 8337a125..08a1cba9

Source commits: 08a1cba9

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-21

Learning cycle: learning-cycle:6de980c9cae114e1 · written by the Chief Agent (gpt-5.5)

---

## Summary

The work made the root build compile shared packages before app typechecking or app builds and updated platform-sdk source nullability for healthScore. It addressed fresh-clone Runtime type errors caused by ignored package dist output and stale local SDK artifacts. 08a1cba9eb6509be88f9fc9d56790a7bbfbf500f

## What changed

- The root npm build now runs build:packages before typechecking or building the apps. (`08a1cba9`, `package.json`)
- The platform-sdk KnowledgeOperationsSnapshot source now declares healthScore as nullable. (`08a1cba9`, `packages/platform-sdk/src/knowledge-operations/KnowledgeOperationsSnapshot.ts`, `packages/platform-sdk/src/knowledge/KnowledgeOperationsSnapshot.ts`)
- The change was made because packages/platform-sdk/dist is ignored by git and was not being built before consumers typechecked against it. (`08a1cba9`)
- The change was made because a fresh clone failed with 121 Runtime type errors. (`08a1cba9`)

## Decisions

- The selected fix was to build shared packages during the root build rather than rely on whatever package dist files already exist on disk. (`08a1cba9`, `package.json`)
- The selected SDK type fix was to declare the healthScore nullability in committed source to match the already-shipped SDK output. (`08a1cba9`, `packages/platform-sdk/src/knowledge-operations/KnowledgeOperationsSnapshot.ts`, `packages/platform-sdk/src/knowledge/KnowledgeOperationsSnapshot.ts`)

## Lessons

- Ignored dist output can hide missing source changes when local build artifacts are stale. (`08a1cba9`)
- Fresh-clone builds should be used to catch failures that local stale artifacts can mask. (`08a1cba9`)
- Committed source must be the authority for SDK types that Runtime depends on. (`08a1cba9`, `packages/platform-sdk/src/knowledge-operations/KnowledgeOperationsSnapshot.ts`, `packages/platform-sdk/src/knowledge/KnowledgeOperationsSnapshot.ts`)

## Open risks

- Because packages/platform-sdk/dist remains ignored by git, removing the shared-package build step could reintroduce stale or missing SDK artifacts in consumer typechecks. (`08a1cba9`, `package.json`)
