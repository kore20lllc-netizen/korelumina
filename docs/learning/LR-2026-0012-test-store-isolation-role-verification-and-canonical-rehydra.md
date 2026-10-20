# LR-2026-0012 — Test store isolation, role verification, and canonical rehydration fixes

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: a299d7a5..904ee646

Source commits: 29304f8b, 80f79086, e09ae8b7

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-20

Learning cycle: learning-cycle:652f69cb20684f86 · written by the Chief Agent (gpt-5.5)

---

## Summary

Tests now isolate governed stores in temporary directories instead of writing to real repository stores, and Runtime behavior is unchanged. 29304f8ba67703ab26d98390fe12e6894aded623 Runtime authorization no longer trusts browser-set role headers or editable client role sources, following ADR-0043. 80f790862f0c8d1feb470520f9475f509d5e0703 Canonical rehydration now avoids overwriting persisted canonical records so promotion history survives restarts. e09ae8b7a8f750b413953ebee8c6d29f6c8a145e

## What changed

- Test processes now route knowledge, canonical items, activation, executive, and continuous learning stores to fresh temporary directories removed on exit. (`29304f8b`)
- The test isolation change prevents the suite from adding test items to the Chief Agent's governed knowledge. (`29304f8b`)
- Four tests were changed to check their own records instead of assuming old locations or an empty shared store. (`29304f8b`)
- Signed-out visitors now default to plain users instead of inhouse-dev. (`80f79086`)
- Browser role switching, the localStorage role override, and simulated checkout plan roles now work only in development builds. (`80f79086`)
- Supabase roles are now read from server-written app_metadata instead of user-editable user_metadata. (`80f79086`)
- Runtime now trusts caller role headers only with the internal token or from this machine outside production. (`80f79086`)
- ADR-0043 was added for verified identity and server-assigned roles. (`docs/adr/ADR-0043-verified-identity-and-server-assigned-roles.md`, `80f79086`)
- Runtime canonical rehydration now restores only missing canonical items and never rewrites persisted ones. (`e09ae8b7`, `apps/lumina-runtime/src/knowledge-platform/runtime/rehydrateRuntimeCanonicalKnowledge.ts`)
- A timestamp stability test was added for canonical rehydration. (`e09ae8b7`, `apps/lumina-runtime/src/knowledge-platform/runtime/__tests__/rehydrateCanonicalTimestampStability.test.ts`)

## Decisions

- ADR-0043 decides that hosted clients send a verified Supabase session token instead of a role. (`docs/adr/ADR-0043-verified-identity-and-server-assigned-roles.md`, `80f79086`)
- ADR-0043 decides that roles are assigned server-side. (`docs/adr/ADR-0043-verified-identity-and-server-assigned-roles.md`, `80f79086`)
- The owner accepted ADR-0043. (`80f79086`)
- The approved Executive Office record for pending approvals location is approval:decision:reasoning:executive-office:mvfp84ba-szacrw. (`approval:decision:reasoning:executive-office:mvfp84ba-szacrw`)
- The approved Executive Office decision for pending approvals location is decision:reasoning:executive-office:mvfp84ba-szacrw. (`decision:reasoning:executive-office:mvfp84ba-szacrw`)
- The approved Executive Office decision for the next step was to capture unlearned Executive Office runtime work. (`decision:reasoning:executive-office:mvfao8up-3jtm98`)
- The approved Executive Office decision prioritized constitutional canonical review. (`decision:reasoning:executive-office:mvf9zccv-vn1p0d`)

## Lessons

- Tests must not run without KORELUMINA_CANONICAL_ROOT and KORELUMINA_ACTIVATION_ROOT isolation because they can write into real canonical items and Chief Agent activation records. (`29304f8b`)
- Shared test stores caused order-dependent failures because executive and learning stores used the working directory and knowledge storage used a per-pid folder inside the repository. (`29304f8b`)
- The isolation fix left the repository runtime stores byte-for-byte unchanged when the listed suites ran without environment variables. (`29304f8b`)
- Browser-set headers must not be authorization evidence because a caller claiming super_admin could see every project. (`80f79086`)
- Client-editable role sources must not drive authorization because localStorage and Supabase user_metadata were previously honored. (`80f79086`)
- Canonical rehydration must not overwrite existing persisted records because rebuilt package copies stripped review evidence, review history, lifecycle history, and supersession from automatically promoted Learning Records. (`e09ae8b7`)
- A Runtime start on the committed store should leave that store byte-for-byte unchanged. (`e09ae8b7`)
- Rebuilding damaged Learning Records from packages can reproduce committed records byte for byte when using the same fields as GovernedCanonicalPromotionService. (`e09ae8b7`)

## Open risks

- Ten knowledge-preservation failures remained after the governed store isolation work. (`29304f8b`)
- SEC-1c, SEC-1d, SEC-1e, and BILL-1 remained as follow-up implementation work for the hosted identity model. (`80f79086`)
- LR-2026-0005 and LR-2026-0006 had been damaged before they were ever committed. (`e09ae8b7`)
