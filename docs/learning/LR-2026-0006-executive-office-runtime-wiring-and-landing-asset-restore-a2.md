# LR-2026-0006 — Executive Office runtime wiring and landing asset restore (a20e06482a29d46a80b599c6808399683bc78fc1, 586695356df95849fba9da214137267bcc2c2375)

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 15849372..58669535

Source commits: a20e0648, 58669535

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-19

Learning cycle: learning-cycle:9c204c665c230ecc · written by the Chief Agent (gpt-5.5)

---

## Summary

Executive Office sections were wired to existing Runtime endpoints so the owner can ask the Chief Agent questions, receive proposed decisions, approve or reject them, view pending approvals, and run learning cycles (a20e06482a29d46a80b599c6808399683bc78fc1). Landing hero video, background video, and icon assets were restored after a prior deletion broke references used by the landing page and index metadata (586695356df95849fba9da214137267bcc2c2375).

## What changed

- Executive Office sections were wired to Runtime using existing endpoints only. (`a20e0648`, `apps/lumina-builder/src/services/executiveOfficeService.ts`)
- The conversation flow now sends the owner's question as an executive event. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/sections/ConversationPanel.tsx`)
- Chief Agent answers now become proposed decisions with approval addressed to the owner. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/sections/ConversationPanel.tsx`)
- Approval Center now approves or rejects proposed decisions. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/sections/ApprovalCenter.tsx`)
- A rejection now requires a reason. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/sections/ApprovalCenter.tsx`)
- Approval Center now lists canonical promotions waiting for review and links into Canonical Review. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/sections/ApprovalCenter.tsx`)
- The command deck now reads activation, autonomy, learning cycles, pending approvals, and canonical count. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/layout/ChiefAgentCommandDeck.tsx`)
- Learn now runs a real learning cycle. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/state/useExecutiveOffice.ts`)
- Executive Office reads use fast records polled every 30 seconds. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/state/useExecutiveOffice.ts`)
- Slow education projections were not used in Executive Office reads. (`a20e0648`)
- Unwired Executive Office parts keep their design-preview badge. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/shared/ExecutiveSection.tsx`)
- Mixed live and preview sections are labeled Partly live. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/shared/ExecutiveSection.tsx`)
- A new Executive Office UI contract was added. (`a20e0648`, `docs/ui-contracts/EXECUTIVE_OFFICE_UI_CONTRACT.md`, `docs/ui-contracts/executive-office-certified-ui.json`)
- A separate Executive Office UI contract script was added. (`a20e0648`, `scripts/executive-ui-contract.mjs`)
- npm run build now verifies both the Knowledge Operations and Executive Office UI contracts. (`a20e0648`, `package.json`)
- The KoreLumina icon was restored. (`58669535`, `apps/lumina-builder/public/lumina.png`)
- The landing hero video assets were restored. (`58669535`, `apps/lumina-builder/public/videos/hero-build-reel.mp4`, `apps/lumina-builder/public/videos/hero-build-reel.webm`)
- The landing background video asset was restored. (`58669535`, `apps/lumina-builder/public/videos/landing-bg.mp4`)

## Decisions

- Chief Agent output was kept propose-only so nothing it says takes effect without owner approval. (`a20e0648`)
- Executive Office used existing endpoints instead of adding new Runtime endpoints. (`a20e0648`)
- Fast records were chosen for 30-second polling instead of slow education projections. (`a20e0648`)
- The Executive Office UI contract was kept separate from the certified Knowledge Operations contract. (`a20e0648`, `scripts/executive-ui-contract.mjs`)
- Decision decision:reasoning:executive-office:mvf85xxn-84wdj4 was rejected for insufficient pending review context. (`decision:reasoning:executive-office:mvf85xxn-84wdj4`)
- Decision decision:reasoning:executive-office:mvf8skn2-qsrny0 was rejected because priority could not be determined. (`decision:reasoning:executive-office:mvf8skn2-qsrny0`)

## Lessons

- Restoring builder workspace assets must not delete landing assets that are still referenced. (`58669535`)
- Missing public video assets can break the landing hero video and background video. (`58669535`, `apps/lumina-builder/public/videos/hero-build-reel.mp4`, `apps/lumina-builder/public/videos/landing-bg.mp4`)
- Missing public icon assets can break the site icon and social image references. (`58669535`, `apps/lumina-builder/public/lumina.png`)
- UI contract checks should be included in build verification when locking approved workspace appearance. (`a20e0648`, `package.json`)
- Separate UI contract scripts reduce the chance that Executive Office certification changes touch the certified Knowledge Operations contract. (`a20e0648`, `scripts/executive-ui-contract.mjs`)

## Open risks

- Some Executive Office parts remained unwired after this work. (`a20e0648`)
- Canonical promotions may still need human review after being listed in Approval Center. (`a20e0648`, `apps/lumina-builder/src/components/workspaces/executive/sections/ApprovalCenter.tsx`)
- Pending review context was insufficient for at least one rejected Executive Office decision. (`decision:reasoning:executive-office:mvf85xxn-84wdj4`)
- Priority was not determinable for at least one rejected Executive Office decision. (`decision:reasoning:executive-office:mvf8skn2-qsrny0`)
