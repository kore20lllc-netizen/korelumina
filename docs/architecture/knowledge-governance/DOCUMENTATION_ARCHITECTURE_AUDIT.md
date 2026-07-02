# KPE-000 — Documentation Architecture Audit

## Status

Draft audit.

## Objective

Establish governance over KoreLumina's documentation and knowledge artifacts before implementing the Knowledge Preservation Engine.

## Findings

KoreLumina already contains mature architecture, governance, ADR, RFC, reconciliation, roadmap, and program documentation.

The next task is not to create more top-level documents. The next task is to classify existing documents and determine canonical ownership.

## Knowledge Domains

- Vision
- Constitution
- Governance
- Architecture
- Engineering Rules
- Canonical Models
- Platform Specifications
- Runtime
- Engineering Intelligence
- Knowledge Platform
- ADR
- RFC
- Reconciliation
- Programs
- Archive
- Reconstruction
- Capability Registry

## Required Classification Fields

Every durable document should eventually have:

- path
- title
- domain
- document class
- status
- canonical owner
- supersedes
- superseded by
- related ADRs
- related capabilities
- notes

## Document Status Values

- active
- canonical
- superseded
- historical
- archived
- draft
- needs-review

## Document Classes

- constitution
- vision
- governance
- architecture
- rule
- model
- strategy
- specification
- roadmap
- ADR
- RFC
- reconciliation
- audit
- playbook
- runbook
- archive
- program

## Immediate Governance Decisions

1. Do not create another Constitution until existing Constitution documents are reconciled.
2. Treat `docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md` as active but not final until KPE schema implementation begins.
3. Treat `docs/governance/KORELUMINA_CONSTITUTION.md` and `docs/architecture/00_PLATFORM_CONSTITUTION.md` as candidates for constitutional reconciliation.
4. Treat archived documents as evidence, not active guidance.
5. Treat reconstruction logs as historical evidence for KPE, not operating guidance.
6. Treat ADRs as authoritative decisions unless superseded.
7. Treat RFCs as proposal records unless accepted and converted into ADRs or canonical docs.

## Next Step

Create a machine-readable documentation registry.
