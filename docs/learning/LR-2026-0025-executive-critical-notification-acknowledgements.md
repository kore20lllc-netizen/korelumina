# LR-2026-0025 — Executive critical notification acknowledgements

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: e8ec6182..8bc9049a

Source commits: 8bc9049a

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-21

Learning cycle: learning-cycle:804c2342171a9faa · written by the Chief Agent (gpt-5.5)

---

## Summary

Critical Executive Office notifications now create Runtime acknowledgement records instead of using an unwired button. Acknowledgement is occurrence-specific, human-only, and unavailable when Runtime is not answering. 8bc9049a36676bd11068848a248dc48cc52e89bc

## What changed

- Critical notification acknowledgement now writes a Runtime record under runtime/executive/acknowledgements. (`8bc9049a`, `apps/lumina-runtime/src/executive/acknowledgement/ExecutiveAcknowledgement.ts`)
- The Executive Office notifications UI now wires acknowledgement controls to service and state code. (`apps/lumina-builder/src/components/workspaces/executive/sections/NotificationsCenter.tsx`, `apps/lumina-builder/src/components/workspaces/executive/state/useExecutiveOffice.ts`, `apps/lumina-builder/src/services/executiveOfficeService.ts`)
- Acknowledged critical conditions remain listed and are shown as acknowledged. (`8bc9049a`)
- Each critical condition now carries a stable key for its specific occurrence. (`8bc9049a`, `apps/lumina-builder/src/components/workspaces/executive/state/executiveRecords.ts`)
- An invalid activation certification is now represented as an acknowledgeable critical condition. (`8bc9049a`)
- Runtime exposes an executive acknowledgement route. (`apps/lumina-runtime/src/routes/executiveAcknowledgement.ts`, `apps/lumina-runtime/src/index.ts`)

## Decisions

- Only a human actor may acknowledge a critical notification. (`8bc9049a`, `apps/lumina-runtime/src/routes/runtimeBoundary.ts`)
- Human-only acknowledgement is enforced both at the Runtime boundary and in the acknowledgement service. (`8bc9049a`, `apps/lumina-runtime/src/routes/runtimeBoundary.ts`, `apps/lumina-runtime/src/executive/acknowledgement/ExecutiveAcknowledgement.ts`)
- Runtime-not-answering conditions cannot be acknowledged. (`8bc9049a`)
- A new occurrence of a critical condition requires its own acknowledgement. (`8bc9049a`)
- Notifications presentation was certified after owner visual approval. (`8bc9049a`, `docs/ui-contracts/executive-office-certified-ui.json`)

## Lessons

- The prior critical notification acknowledgement button was unwired. (`8bc9049a`)
- Acknowledgement behavior needs Runtime tests. (`apps/lumina-runtime/src/executive/acknowledgement/__tests__/ExecutiveAcknowledgement.test.ts`)
- Owner visual approval was used before certifying notification presentation. (`8bc9049a`, `docs/ui-contracts/executive-office-certified-ui.json`)
- Runtime suites passed after the acknowledgement work. (`8bc9049a`)

## Open risks

- Runtime-not-answering conditions remain unacknowledgeable. (`8bc9049a`)
