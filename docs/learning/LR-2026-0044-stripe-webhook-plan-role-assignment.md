# LR-2026-0044 — Stripe webhook plan role assignment

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 8ce13e6b..65947100

Source commits: 65947100

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-22

Learning cycle: learning-cycle:b1e0510abfe1516d · written by the Chief Agent (gpt-5.5)

---

## Summary

Stripe webhook handling was added so paid plan roles are assigned by the runtime from verified Stripe events, not by the browser, in line with ADR-0043 Decision 3 as described in 65947100e9d032eb5e82df862ae9096a99b4c163. The runtime maps subscription prices to plans from environment configuration, updates app_metadata with the service role key, preserves staff roles, ignores replayed or out-of-order events, and records changes under runtime/governance/plan-assignments as described in 65947100e9d032eb5e82df862ae9096a99b4c163.

## What changed

- Added Stripe billing logic for assigning plan roles from subscription webhook data. (`apps/lumina-runtime/src/billing/StripeBilling.ts`, `65947100`)
- Added Stripe signature verification for webhook requests using the raw body. (`apps/lumina-runtime/src/billing/StripeSignature.ts`, `65947100`)
- Added a Stripe webhook route to the runtime. (`apps/lumina-runtime/src/routes/stripeWebhook.ts`, `apps/lumina-runtime/src/index.ts`)
- Added role assignment support for governance-related role updates. (`apps/lumina-runtime/src/governance/roles/RoleAssignment.ts`, `65947100`)
- Added tests for Stripe billing behavior. (`apps/lumina-runtime/src/billing/__tests__/StripeBilling.test.ts`, `65947100`)

## Decisions

- Paid plan roles must come from the payment provider and not from the browser. (`65947100`)
- The runtime verifies Stripe webhook signatures before processing billing role changes. (`apps/lumina-runtime/src/billing/StripeSignature.ts`, `65947100`)
- Subscription prices are mapped to plans using runtime environment configuration. (`apps/lumina-runtime/src/billing/StripeBilling.ts`, `65947100`)
- Billing-derived roles are written to app_metadata using the service role key. (`apps/lumina-runtime/src/billing/StripeBilling.ts`, `65947100`)
- Billing role assignment must not replace a staff role. (`apps/lumina-runtime/src/billing/StripeBilling.ts`, `65947100`)
- Webhook replay and out-of-order events are ignored. (`apps/lumina-runtime/src/billing/StripeBilling.ts`, `65947100`)
- Every plan role change is recorded in runtime/governance/plan-assignments. (`65947100`)

## Lessons

- Use raw request bodies for Stripe webhook signature verification. (`apps/lumina-runtime/src/billing/StripeSignature.ts`, `65947100`)
- Billing integrations should protect staff roles from being overwritten by plan synchronization. (`apps/lumina-runtime/src/billing/StripeBilling.ts`, `65947100`)
- Webhook handlers should be idempotent against replayed and out-of-order events. (`apps/lumina-runtime/src/billing/StripeBilling.ts`, `65947100`)
- Plan assignment changes need governance records for traceability. (`65947100`)
