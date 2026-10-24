# LR-2026-0053 — Ownerless project authorization and paid repair engagements

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 85b14433..b75c7872

Source commits: 530e7569, b75c7872

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-23

Learning cycle: learning-cycle:7e614936d620cf5e · written by the Chief Agent (gpt-5.5)

---

## Summary

Ownerless projects were restricted once real sign-in exists, after imported projects without recorded owners were accessible to signed-in customers outside production. [530e7569de0261773aa42f13bb2cdc0ab0211650] Paid repair quotes and engagements were added, using owner-published versioned rate tables, enforced pricing, Stripe card holds, and recorded repair workflow steps. [b75c7872f472ae33b297cfb9042e9ff33362f95a]

## What changed

- Ownerless projects are now visible only to staff when an identity provider is configured. (`530e7569`, `apps/lumina-runtime/src/routes/runtimeAuthorization.ts`)
- Open access to ownerless projects remains available only for local development without sign-in or by explicit setting. (`530e7569`, `apps/lumina-runtime/src/projects/projectOwnership.ts`)
- Only an admin can assign an owner to an unowned project. (`530e7569`, `apps/lumina-runtime/src/routes/__tests__/ownerlessProjects.test.ts`)
- Runtime can quote paid repairs for chosen findings from a versioned rate table published by the project owner. (`b75c7872`, `apps/lumina-runtime/src/repair/RepairRates.ts`)
- Runtime enforces a minimum repair price of 500 USD and per-finding prices of 400, 200, 75, 25, and 0 by severity. (`b75c7872`, `apps/lumina-runtime/src/repair/RepairRates.ts`)
- Runtime refuses repair agreement to any price other than the quoted price. (`b75c7872`, `apps/lumina-runtime/src/repair/__tests__/PaidRepair.test.ts`)
- Paid repair creates an engagement for KoreLumina engineers to take, work, review, and deliver as a pull request or download. (`b75c7872`, `apps/lumina-runtime/src/repair/RepairEngagements.ts`)
- Repair engagement steps are recorded. (`b75c7872`, `apps/lumina-runtime/src/repair/RepairEngagements.ts`)
- Paid repair uses Stripe for the card hold. (`b75c7872`, `apps/lumina-runtime/src/routes/repairEngagements.ts`)
- Repair engagement routes were registered in the runtime index. (`b75c7872`, `apps/lumina-runtime/src/index.ts`)

## Decisions

- Ownerless production-like projects should be treated as staff-only instead of public once sign-in is real. (`530e7569`)
- Admin-only owner assignment was chosen for unowned projects. (`530e7569`)
- Repair pricing is based on the owner-published versioned rate table. (`b75c7872`, `apps/lumina-runtime/src/repair/RepairRates.ts`)
- Repair agreements must match Runtime's quoted price. (`b75c7872`)
- Repair delivery supports pull request or download outputs. (`b75c7872`, `apps/lumina-runtime/src/repair/RepairEngagements.ts`)

## Lessons

- Imported projects without recorded owners created an authorization gap where a newly signed-in customer could see, change, and claim the project outside production. (`530e7569`)
- Ownerless-project behavior needs tests that cover real sign-in and admin ownership assignment. (`apps/lumina-runtime/src/routes/__tests__/ownerlessProjects.test.ts`, `530e7569`)
- Paid repair needs tests that cover quote pricing and price-agreement enforcement. (`apps/lumina-runtime/src/repair/__tests__/PaidRepair.test.ts`, `b75c7872`)
