# LR-2026-0050 — ADR-0046 audit and repair authorization

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 2601a62f..ebde217b

Source commits: 0a7c1bff, ebde217b

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-23

Learning cycle: learning-cycle:7b9856d1ec011481 · written by the Chief Agent (gpt-5.5)

---

## Summary

ADR-0046 aligned customer-facing repository diagnosis with in-house repair boundaries in docs and Runtime enforcement, citing 0a7c1bff8c891d139e97f3e438759d1961cbaa30 and ebde217b5c2260cb1fea0583f51f44effcf87d10. Runtime closed unauthenticated audit and repair routes under one policy based on the verified caller and project metadata, citing ebde217b5c2260cb1fea0583f51f44effcf87d10 and apps/lumina-runtime/src/routes/auditPolicy.ts.

## What changed

- ADR-0046 was added to document customer diagnosis and in-house repair boundaries. (`0a7c1bff`, `docs/adr/ADR-0046-customer-diagnosis-in-house-repair.md`)
- ENGINEERING_SPEC_V1 was updated to reflect the ADR-0046 access model. (`0a7c1bff`, `ebde217b`, `docs/architecture/ENGINEERING_SPEC_V1.md`)
- LANDING_CONTRACT was updated because the landing page offered audit capability on Business and Enterprise while the engineering spec had kept the audit engine internal. (`0a7c1bff`, `docs/architecture/LANDING_CONTRACT.md`)
- Runtime now uses a shared audit policy for audit and repair routes. (`ebde217b`, `apps/lumina-runtime/src/routes/auditPolicy.ts`)
- Authorization checks were added to audit, fix-plan, generate-fixes, create-draft, apply-draft, drafts, and revert-draft routes. (`ebde217b`, `apps/lumina-runtime/src/routes/audit.ts`, `apps/lumina-runtime/src/routes/fixPlan.ts`, `apps/lumina-runtime/src/routes/generateFixes.ts`, `apps/lumina-runtime/src/routes/createDraft.ts`, `apps/lumina-runtime/src/routes/applyDraft.ts`, `apps/lumina-runtime/src/routes/drafts.ts`, `apps/lumina-runtime/src/routes/revertDraft.ts`)
- Repository audit route behavior was changed and covered by updated tests. (`ebde217b`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`, `apps/lumina-runtime/src/routes/__tests__/repositoryAudit.test.ts`)
- New audit policy tests were added for the Runtime authorization policy. (`ebde217b`, `apps/lumina-runtime/src/routes/__tests__/auditPolicy.test.ts`)

## Decisions

- Business and Enterprise customers may diagnose their imported repositories. (`0a7c1bff`, `docs/adr/ADR-0046-customer-diagnosis-in-house-repair.md`)
- Repair, fix plans, deep audit, and findings-to-fixes remain for KoreLumina engineers. (`0a7c1bff`, `ebde217b`, `docs/adr/ADR-0046-customer-diagnosis-in-house-repair.md`)
- Runtime authorization is decided from the verified caller and the project's metadata. (`ebde217b`, `apps/lumina-runtime/src/routes/auditPolicy.ts`)
- AI Builder drafts remain available to the project's managers. (`ebde217b`, `docs/adr/ADR-0046-customer-diagnosis-in-house-repair.md`)
- The owner accepted ADR-0046 with the correction that AI Builder is not repair. (`ebde217b`, `docs/adr/ADR-0046-customer-diagnosis-in-house-repair.md`)

## Lessons

- Product contracts and engineering specs must be checked together because the landing contract and engineering spec described different audit availability before ADR-0046. (`0a7c1bff`, `docs/architecture/ENGINEERING_SPEC_V1.md`, `docs/architecture/LANDING_CONTRACT.md`)
- Audit and repair endpoints must not ship without authorization because the earlier routes allowed anyone reaching Runtime to audit, change, or patch any project. (`ebde217b`, `apps/lumina-runtime/src/routes/audit.ts`, `apps/lumina-runtime/src/routes/fixPlan.ts`, `apps/lumina-runtime/src/routes/generateFixes.ts`)
- A single shared policy should govern related audit and repair routes because the fix closed the earlier open audit and repair routes under one policy. (`ebde217b`, `apps/lumina-runtime/src/routes/auditPolicy.ts`)
- AI Builder authorization should be treated separately from repair authorization because the accepted ADR correction says AI Builder is not repair. (`ebde217b`, `docs/adr/ADR-0046-customer-diagnosis-in-house-repair.md`)

## Open risks

- Runtime authorization now depends on the verified caller and project metadata being correct. (`ebde217b`, `apps/lumina-runtime/src/routes/auditPolicy.ts`)
