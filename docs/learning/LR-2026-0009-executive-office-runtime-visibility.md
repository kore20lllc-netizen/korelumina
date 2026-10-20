# LR-2026-0009 — Executive Office runtime visibility

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: a3e61d84..cc72a86a

Source commits: 1103f13e, 91139673, cc72a86a

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-19

Learning cycle: learning-cycle:e74d2b874becb4ea · written by the Chief Agent (gpt-5.5)

---

## Summary

1103f13ee8928e6a51e12344730fac96f46110cc added live read-only operational state to Chief Agent reasoning because governed knowledge did not show what was happening now. 9113967352a0f494ec398a4fe0ef76c63fd32949 changed executive knowledge retrieval to include all current-policy knowledge because word matching excluded governing documents. cc72a86a01c2dc25df66f013b0f8fb2614d990f3 made five Executive Office sections read Runtime records.

## What changed

- Chief Agent reasoning now receives a read-only snapshot of activation, continuous learning, recent cycles, pending executive approvals, recent decisions, and knowledge waiting for canonical review. (`1103f13e`, `apps/lumina-runtime/src/executive/reasoning/ChiefAgentOperationalState.ts`)
- Operational snapshot entries have operational ids that the Chief Agent may cite. (`1103f13e`, `apps/lumina-runtime/src/executive/reasoning/ChiefAgentOperationalState.ts`)
- Reasoning records now keep the operational ids that the Chief Agent saw. (`1103f13e`, `apps/lumina-runtime/src/executive/reasoning/ChiefAgentReasoningExecutionService.ts`)
- GET /api/executive/operational-state now exposes the same operational state the Chief Agent sees. (`1103f13e`, `apps/lumina-runtime/src/routes/executiveOperationalState.ts`)
- The command deck now reads learning cycles in the Runtime order correctly instead of showing the oldest cycle as latest. (`1103f13e`, `apps/lumina-builder/src/components/workspaces/executive/layout/ChiefAgentCommandDeck.tsx`)
- Executive knowledge context now asks retrieval for all current-policy items instead of filtering by shared title or summary words. (`91139673`, `apps/lumina-runtime/src/executive/context/ExecutiveKnowledgeContextReducer.ts`, `apps/lumina-runtime/src/knowledge-platform/context/AgentContextRequest.ts`)
- The governed content reader still ranks certified document text by the question within its budget. (`91139673`, `apps/lumina-runtime/src/knowledge-platform/context/KnowledgeContextBuilder.ts`)
- Activity Center now composes a Runtime-backed operational timeline from proposals, owner decisions, Learning Records, canonical promotions, and activation. (`cc72a86a`, `apps/lumina-builder/src/components/workspaces/executive/sections/ActivityCenter.tsx`, `apps/lumina-builder/src/components/workspaces/executive/state/executiveRecords.ts`)
- Notifications Center now classifies live Runtime state by priority. (`cc72a86a`, `apps/lumina-builder/src/components/workspaces/executive/sections/NotificationsCenter.tsx`, `apps/lumina-builder/src/components/workspaces/executive/state/executiveRecords.ts`)
- Knowledge Center now groups current-policy canonical knowledge by source document and excludes certification records kept in /tmp. (`cc72a86a`, `apps/lumina-builder/src/components/workspaces/executive/sections/KnowledgeCenter.tsx`, `apps/lumina-builder/src/components/workspaces/executive/state/executiveRecords.ts`)
- Memory Center now shows real sizes for existing layers and marks missing layers as Not built. (`cc72a86a`, `apps/lumina-builder/src/components/workspaces/executive/sections/MemoryCenter.tsx`)
- Projects Center now lists every project imported into the Runtime with its state. (`cc72a86a`, `apps/lumina-builder/src/components/workspaces/executive/sections/ProjectsCenter.tsx`)

## Decisions

- Operational state was made context rather than knowledge so it does not authorize actions. (`1103f13e`)
- Governed knowledge still decides what the Chief Agent may do. (`1103f13e`)
- Operational ids not present in the current snapshot are rejected as unauthorized evidence. (`1103f13e`)
- Unreadable operational-state parts are reported as unavailable rather than guessed. (`1103f13e`)
- Executive reasoning uses retrieval all for current-policy knowledge, while other callers keep default search. (`91139673`, `apps/lumina-runtime/src/executive/context/ExecutiveKnowledgeContextReducer.ts`)
- Missions, Planning, Agents, and Execution remain design previews because Runtime has no records for them yet. (`cc72a86a`)

## Lessons

- Chief Agent reasoning over governed knowledge alone was insufficient for operational prioritization because it could not see the review queue. (`1103f13e`)
- The Chief Agent produced rejected answers when asked which pending canonical review to handle first without operational state. (`1103f13e`)
- Word matching against titles and summaries was unsafe for executive reasoning because it dropped governing documents. (`91139673`)
- For the question about pending canonical review, the old context builder gave the Chief Agent only 8 of 26 current-policy items. (`91139673`)
- The old context builder omitted the Platform Constitution, Business Charter, Blueprint, Vision 2050, and Chief Agent architecture for the pending-review question. (`91139673`)
- UI code must respect Runtime ordering because learning cycles are listed newest first. (`1103f13e`, `apps/lumina-builder/src/components/workspaces/executive/layout/ChiefAgentCommandDeck.tsx`)
- Tests were added for operational state and current-policy retrieval to protect the new behavior. (`apps/lumina-runtime/src/executive/reasoning/__tests__/ChiefAgentOperationalState.test.ts`, `apps/lumina-runtime/src/knowledge-platform/context/__tests__/KnowledgeContextBuilderCurrentPolicy.test.ts`)

## Open risks

- The proposed decision to prioritize constitutional canonical review still has a pending approval. (`decision:reasoning:executive-office:mvf9zccv-vn1p0d`, `approval:decision:reasoning:executive-office:mvf9zccv-vn1p0d`)
- The proposed decision on Business Charter speed and revenue boundary still has a pending approval. (`decision:reasoning:executive-office:mvfaifh2-gon9us`, `approval:decision:reasoning:executive-office:mvfaifh2-gon9us`)
- The proposed decision to capture unlearned Executive Office runtime work still has a pending approval. (`decision:reasoning:executive-office:mvfao8up-3jtm98`, `approval:decision:reasoning:executive-office:mvfao8up-3jtm98`)
- The platform card is only partly live. (`cc72a86a`, `apps/lumina-builder/src/components/workspaces/executive/sections/ProjectsCenter.tsx`)
- Missions, Planning, Agents, and Execution still lack Runtime records. (`cc72a86a`)
- Some Memory Center layers are still not built. (`cc72a86a`, `apps/lumina-builder/src/components/workspaces/executive/sections/MemoryCenter.tsx`)
