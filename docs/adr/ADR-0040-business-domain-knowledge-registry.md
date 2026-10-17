# ADR-0040 — Business and Domain Knowledge Source Registry

## Status

Accepted

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: Canonical source registry, ownership, approval, privacy, and minimum educational scope for business and domain knowledge in the Chief Agent Educational Corpus.

---

## Context

CA-005 (Learning Constitution) lists business knowledge and domain knowledge as curriculum categories. It also records them as **UNRESOLVED**: their canonical source registries, approval owners, privacy rules, and minimum curriculum requirements are not defined.

A category may enter the Educational Corpus only when its authority, approval state, ownership, scope, version, and relationship to higher authority are known (CA-005).

The certified Day-0 coverage contract (`CertifiedEducationalCoverageRequirements.ts`, module `business-domain-literacy`) requires at least one approved `business` item and one approved `domain` item. No source can produce those kinds today, so Day-0 curriculum coverage cannot be completed.

Related capabilities: Knowledge Preservation (Genesis historical replay), Educational Corpus, Chief Agent Day-0 certification.

---

## Problem

The Chief Agent cannot be certified for business and domain literacy because:

1. No repository location is registered as the source of business or domain knowledge.
2. Genesis discovery classifies any such document as generic `documentation`.
3. The Educational Corpus therefore never projects a `business` or `domain` item.

---

## Alternatives Considered

**1. Declare the kind in each document's metadata only.**
Rejected. The kind would depend on every author remembering a field, and there would still be no registry, owner, or approval rule as CA-005 requires.

**2. Treat business and domain documents as governing authority (like governance or the constitution).**
Rejected. Business and domain knowledge inform the Chief Agent; they do not govern it. Vision 2050, the Constitution, and the Blueprint stay above them.

**3. Register two repository directories as the canonical registries, classified by path.** (Chosen.)
Classification is deterministic, reviewable in Git, and follows the same pattern as `docs/architecture`, `docs/governance`, and `docs/adr`.

---

## Decision

1. **Registries.**
   - `docs/business/` is the canonical source registry for business knowledge.
   - `docs/domain/` is the canonical source registry for domain knowledge.
   Both are added to the default Genesis documentation roots.

2. **Classification.** Documents in those directories are discovered as `document` evidence with authority class and document classification `business` or `domain`. The Educational Corpus projects them as kinds `business` and `domain`.

3. **Authority.** `business` and `domain` are not governing authority classes. They are subordinate to the Canon, the Constitution, constitutional amendments, the Blueprint, and governance. Each document must state its relationship to the Canon; where they conflict, the Canon governs.

4. **Ownership and approval.** The approval owner is the Founder, Kore20 LLC, or a delegate the Founder names in writing. A document enters the corpus only with `Status: Approved`, `Version`, `Owner`, `Scope`, and an approval date, through the normal Genesis admission, human canonical review, and explicit promotion.

5. **Privacy.** These registries hold platform-scope knowledge (ADR-0039 Platform Memory) only. They must never contain customer data, personal data, credentials, keys, or other secrets. Current prices and plan limits stay in the landing page and Landing Contract; registry documents describe the business model and refer to those sources.

6. **Minimum educational scope.** Day-0 business and domain literacy requires, at minimum:
   - `docs/business/KORELUMINA_BUSINESS_CHARTER.md`: what KoreLumina sells, to whom, how it earns revenue, priorities, customer ownership, and business boundaries for the Chief Agent.
   - `docs/domain/KORELUMINA_DOMAIN_PRIMER.md`: the problem domains, differentiators, domain terms, and standards and constraints.

---

## Rationale

This resolves the two CA-005 UNRESOLVED items for business and domain knowledge with the smallest change that keeps every existing gate in force: approval, admission, human review, and promotion all still apply. Path-based classification matches how the other governed document families already work.

---

## Consequences

Positive:

- Day-0 business and domain coverage becomes achievable from approved, human-reviewed sources.
- The Chief Agent learns what KoreLumina sells and the customer-ownership boundaries it must respect.

Negative:

- Adding the two documents changes the canonical corpus, so Day-0 certification becomes stale and must be re-certified once, and authority resolutions re-recorded.

Trade-offs:

- Business documents change more often than architecture. Each change needs a new approved version and a new review cycle.

---

## Blueprint References

- `docs/canon/VISION_2050.md`: Human Leadership; Age III Organization.
- `docs/architecture/amendments/CA-005_LEARNING_CONSTITUTION.md`: curriculum categories and UNRESOLVED business and domain registries.
- `docs/adr/ADR-0039-knowledge-scope-architecture.md`: Platform Memory scope.
- `docs/architecture/LANDING_CONTRACT.md`: source of public offerings and pricing.

---

## Implementation Impact

- `DocumentationHistoricalSourceDiscoverer.ts`: add `docs/business` and `docs/domain` to the default roots; classify them as `business` and `domain`.
- `EducationalArtifactProjector.ts`: map document classifications `business` and `domain` to the same education kinds.
- Tests: discovery classification, default roots, and projection (3 new tests).
- No change to admission policy, governing authority classes, review policies, or the Day-0 coverage contract.

---

## Validation

- Runtime test suites for knowledge education and Genesis discovery: 872 tests, no new failures against baseline (the remaining failures predate this change).
- Bounded Genesis replay of the two documents, followed by human canonical review and promotion, and Day-0 re-certification showing `business:approved-business-knowledge` and `domain:approved-domain-knowledge` satisfied.

---

## Related Tickets

- KO-3d: Business and domain curriculum sources.

---

## Related Reconciliation

- CA-005 UNRESOLVED: business and domain knowledge registries.
