# LR-2026-0060 — Real Website Transform workflow

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 24142538..fe4ca896

Source commits: fe4ca896

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-24

Learning cycle: learning-cycle:ee0c445c06d37d9e · written by the Chief Agent (gpt-5.5)

---

## Summary

Transform changed from a timer and fixed-path placeholder writer into a runtime-backed website analysis, planning, draft-build, review, apply, and undo workflow, cited by fe4ca896900c395e676c33607546795bdd7e43d1. Runtime now enforces supported project types, access rules, safe file placement, and draft review before apply, cited by fe4ca896900c395e676c33607546795bdd7e43d1.

## What changed

- The Transform modal was rewritten and split into stage, draft view, and state components to replace the prior timer-based and placeholder-heavy flow. (`fe4ca896`, `apps/lumina-builder/src/components/transform/TransformModal.tsx`, `apps/lumina-builder/src/components/transform/sections/TransformStages.tsx`, `apps/lumina-builder/src/components/transform/sections/TransformDraftView.tsx`, `apps/lumina-builder/src/components/transform/state/useWebsiteTransform.ts`)
- Runtime website analysis was added to read the project framework, routes, components, and styles before planning. (`fe4ca896`, `apps/lumina-runtime/src/transform/websiteAnalysis.ts`)
- Runtime now supports Transform only for Next.js App Router, Next.js Pages Router, and React Router projects, and refuses other project types with a reason. (`fe4ca896`, `apps/lumina-runtime/src/transform/websiteAnalysis.ts`)
- AI-backed website planning was added so the configured model plans pages instead of using a fixed list of paths. (`fe4ca896`, `apps/lumina-runtime/src/transform/websitePlan.ts`, `apps/lumina-runtime/src/ai/AIOrchestrator.ts`)
- Website build generation was added to write a shared layout, pages, and route wiring into a draft. (`fe4ca896`, `apps/lumina-runtime/src/transform/websiteBuild.ts`)
- The runtime Transform route was added and registered so the builder can call the website Transform backend. (`fe4ca896`, `apps/lumina-runtime/src/routes/websiteTransform.ts`, `apps/lumina-runtime/src/index.ts`, `apps/lumina-builder/src/services/runtime/websiteTransform.ts`)
- Transform now avoids taking an existing route or file when deciding where generated files should go. (`fe4ca896`, `apps/lumina-runtime/src/transform/websiteBuild.ts`, `apps/lumina-runtime/src/transform/websitePlan.ts`)
- The owner now reads the full generated draft before applying it. (`fe4ca896`, `apps/lumina-builder/src/components/transform/sections/TransformDraftView.tsx`)
- Transform now supports undo after applying a draft. (`fe4ca896`, `apps/lumina-builder/src/components/transform/state/useWebsiteTransform.ts`)
- Unknown facts remain visible as placeholders instead of being hidden or invented. (`fe4ca896`)
- The Developer workspace and command deck gained a Transform action. (`fe4ca896`, `apps/lumina-builder/src/components/workspaces/developer/DeveloperWorkspace.tsx`, `apps/lumina-builder/src/components/workspaces/developer/layout/DeveloperCommandDeck.tsx`)
- Transform UI contract assets and scripts were added or updated to certify and guard the Transform UI. (`fe4ca896`, `docs/ui-contracts/TRANSFORM_UI_CONTRACT.md`, `docs/ui-contracts/transform-certified-ui.json`, `scripts/transform-ui-contract.mjs`)
- Developer UI contract assets and scripts were updated for the Developer deck Transform action. (`fe4ca896`, `docs/ui-contracts/DEVELOPER_UI_CONTRACT.md`, `docs/ui-contracts/developer-certified-ui.json`, `scripts/developer-ui-contract.mjs`)
- Runtime tests were added for website Transform behavior. (`fe4ca896`, `apps/lumina-runtime/src/transform/__tests__/WebsiteTransform.test.ts`)

## Decisions

- The team chose runtime inspection over simulated analysis because the prior analysis was only a timer. (`fe4ca896`, `apps/lumina-runtime/src/transform/websiteAnalysis.ts`)
- The team chose model-generated plans over a fixed path list because the prior plan used fixed paths. (`fe4ca896`, `apps/lumina-runtime/src/transform/websitePlan.ts`)
- KoreLumina decides generated file locations so no existing route or file is taken. (`fe4ca896`, `apps/lumina-runtime/src/transform/websiteBuild.ts`)
- Draft review before apply was chosen because the prior Apply wrote placeholder pages straight into the customer project without an overwrite check. (`fe4ca896`, `apps/lumina-builder/src/components/transform/sections/TransformDraftView.tsx`)
- Transform access was limited to the project manager on Pro and above in Runtime. (`fe4ca896`, `apps/lumina-runtime/src/routes/websiteTransform.ts`)
- Free users are told the one-time unlock arrives with checkout instead of being granted the current Runtime Transform flow. (`fe4ca896`)
- The two UI looks were approved by the owner and guarded with UI contracts. (`fe4ca896`, `docs/ui-contracts/developer-certified-ui.json`, `docs/ui-contracts/transform-certified-ui.json`)

## Lessons

- Do not ship timer-based analysis as if it were real project analysis. (`fe4ca896`)
- Do not apply generated files directly into a customer project without overwrite protection. (`fe4ca896`)
- Generated site changes should be assembled into a reviewable draft before they are applied. (`fe4ca896`, `apps/lumina-builder/src/components/transform/sections/TransformDraftView.tsx`)
- Unsupported frameworks should be refused with an explicit reason instead of forced through the Transform flow. (`fe4ca896`, `apps/lumina-runtime/src/transform/websiteAnalysis.ts`)
- Unknown facts should remain visible placeholders rather than becoming fabricated content. (`fe4ca896`)
- UI contract scripts are useful for guarding approved workspace and Transform UI states in the build. (`fe4ca896`, `scripts/developer-ui-contract.mjs`, `scripts/transform-ui-contract.mjs`)

## Open risks

- Free-tier one-time Transform unlock still depends on a future checkout path. (`fe4ca896`)
- Projects outside Next.js App Router, Next.js Pages Router, and React Router remain unsupported by Transform. (`fe4ca896`, `apps/lumina-runtime/src/transform/websiteAnalysis.ts`)
