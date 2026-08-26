---
title: KoreLumina Canonical Document Hierarchy
status: Canonical
owner: Constitutional Office
authority: Supreme
version: 1.0.0
scope: Organization-wide
review_cycle: Annual
related:
  - README.md
  - VISION_2050.md
  - ../README.md
  - ../architecture/00_PLATFORM_CONSTITUTION.md
  - ../architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE.md
  - ../architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE_AUDIT.md
---

# KoreLumina Canonical Document Hierarchy

> Historical Knowledge Operations V1/V2 references in this document point to `docs/archive/knowledge-operations/`. Those archived documents are retained for provenance and reconciliation only and are not current implementation authority.


## 1. Purpose

This document establishes the governing hierarchy for KoreLumina documentation.

It does not create new architecture, redefine subsystem boundaries, or approve unapproved technical designs.

It classifies authority, ownership, approval status, supersession, architectural scope, and conflict-resolution rules for repository documents.

## 2. Governing principle

Human leadership remains the final authority.

Within the repository, authority flows downward from identity and constitutional governance into architecture, specifications, implementation, validation, and preserved knowledge.

No lower-authority document may silently override a higher-authority document.

## 3. Canonical precedence

The governing precedence order is:

1. Human leadership decisions explicitly recorded in the repository
2. Canon
3. Constitution
4. Blueprint
5. Approved Engineering Decision Records and accepted constitutional amendments
6. Approved architecture and governing reconciliations
7. Frozen or approved platform and subsystem specifications
8. Approved capability specifications and operating models
9. Approved playbooks, runbooks, and execution governance
10. Programs, roadmaps, and implementation plans
11. Validation, certification, and closeout records
12. Implementation
13. Drafts, RFCs, research, audits, and proposals
14. Historical and archived material

A newer document does not outrank an older document merely because it is newer.

Status, authority, explicit supersession, and scope determine precedence.

## 4. Canon

### Scope

The Canon defines permanent organizational identity, enduring purpose, long-term direction, and truths that must not change casually.

### Owner

Constitutional Office.

### Approval status

Canonical and supreme within the repository, subordinate only to human leadership.

### Governing documents

- `docs/canon/README.md`
- `docs/canon/FOUNDING_CHARTER.md`
- `docs/canon/MANIFESTO.md`
- `docs/canon/VISION_2050.md`
- `docs/canon/DESTINY.md`

### Rule

Canon documents govern identity and strategic direction. They do not define implementation detail.

## 5. Constitution

### Scope

The Constitution governs authority, engineering law, knowledge law, organizational responsibilities, approval boundaries, and mandatory operating principles.

### Owner

Constitutional Office, subject to human leadership.

### Current authority state

The repository contains multiple constitutional artifacts. Until a dedicated constitutional reconciliation explicitly supersedes them, the following rule applies:

- `docs/constitution/KORELUMINA_CONSTITUTION.md` governs constitutional identity and organizational law where its scope is explicit.
- `docs/architecture/00_PLATFORM_CONSTITUTION.md` governs platform architecture, implementation discipline, Knowledge Platform behavior, historical learning, and Engineer Agent growth where its scope is explicit.
- `docs/governance/KORELUMINA_CONSTITUTION.md`, if present and active, must be treated as a constitutional candidate requiring reconciliation rather than silently preferred.
- `docs/constitution/AMENDMENT_PROCESS.md` governs amendment procedure, not substantive architecture.

### Conflict rule

When constitutional documents disagree within overlapping scope, the conflict is unresolved until a formal constitutional reconciliation or amendment identifies the controlling provision.

No architecture, ADR, specification, reconciliation, or implementation may resolve that conflict by implication.

## 6. Blueprint

### Scope

The Blueprint defines the whole-platform architectural map, major domains, strategic assets, capability model, organizational structure, and dependency direction.

### Owner

Chief Systems Architect under constitutional governance.

### Governing document

- `BLUEPRINT.md`

### Approval status

Governing architecture unless explicitly marked draft or superseded in the document itself.

### Rule

Subsystem architecture and specifications must remain traceable to the Blueprint.

## 7. Engineering Decision Records and amendments

### Scope

Approved EDRs and ADRs govern explicit architectural decisions, trade-offs, exceptions, and supersession decisions.

### Owner

The architectural owner named by the record, with required governance approval.

### Approval status

- Approved or accepted: authoritative within stated scope.
- Proposed or draft: non-governing.
- Superseded: historical evidence only.
- Rejected: non-governing decision history.

### Rule

An approved ADR may supersede lower-level architecture or specifications only when it explicitly identifies what it supersedes.

An ADR cannot override the Canon or Constitution unless it is itself an approved constitutional amendment processed under the amendment rules.

## 8. Architecture

### Scope

Architecture documents define subsystem structure, bounded contexts, ownership, public contracts, dependency direction, and platform layering.

### Owner

The architecture owner declared by the document or responsible platform office.

### Approval status

- Approved, active, frozen, canonical, or authoritative: governing within declared scope.
- Draft, proposed, audit, or review: non-final.
- Historical or archived: evidence only.

### Governing examples

- `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md`
- `docs/architecture/ARCHITECTURE_BASELINE_1_0.md`
- approved platform architecture documents
- approved bounded-context reconciliations

### Rule

Architecture cannot contradict the Canon, Constitution, Blueprint, or an approved ADR governing the same scope.

## 9. Reconciliations

### Scope

Reconciliations compare original intent, implementation reality, approved deviations, conflicts, remaining work, and final architectural classification.

### Finality criteria

A reconciliation is final only when all of the following are true:

- status explicitly says approved, complete, closed, frozen, final, or equivalent;
- scope is explicit;
- implementation or document set being reconciled is identified;
- conflicts and remaining work are identified;
- the document states the resulting authority or architecture state;
- no higher-authority document contradicts it.

### Governing reconciliations

The following are final within their declared subsystem scope unless superseded by a higher-authority document:

- `docs/architecture/KP_ARCHITECTURAL_RECONCILIATION.md` — Phase 0 Knowledge Platform reconciliation and roadmap realignment; authoritative for the reconciled Phase 0 state, but not proof that later learning capabilities are complete.
- `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md` — final for Organizational Memory boundaries and frozen implementation state.
- other reconciliation documents explicitly marked complete, frozen, final, or closeout are authoritative only within their named capability or epic.

### Non-final reconciliations

- `docs/architecture/knowledge-governance/reconciliation/KR-004_KNOWLEDGE_ARCHITECTURE_RECONCILIATION.md` is a draft reconciliation and is not final authority.
- Any reconciliation marked draft, review, proposed, or incomplete remains non-governing except as evidence.

### Conflict rule

A final reconciliation may govern the implementation reality of its subsystem, but it cannot override higher-level Canon, Constitution, Blueprint, approved ADRs, or approved architecture outside its scope.

## 10. Canonical models

### Scope

Canonical models define shared knowledge or data semantics consumed across subsystems.

### Current status

- `docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md` is active design guidance but remains Draft v1.
- `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md` is Draft v1.
- `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md` is Draft v1.

### Rule

Draft canonical models may guide implementation experiments and audits, but they do not outrank approved architecture, approved reconciliation, or approved ADRs.

They become governing only when explicitly approved, frozen, or adopted by an approved higher-authority document.

## 11. Specifications

### Scope

Specifications define the contract for a platform, subsystem, workspace, capability, or interface.

### Approval status

- Frozen, approved, active, or governing: authoritative within scope.
- Proposed or draft: non-final.
- Superseded: historical evidence.

### Supersession rule

A specification is superseded only when:

- its own metadata identifies a successor;
- a successor explicitly names it under `supersedes`;
- an approved ADR, architecture document, or reconciliation declares it superseded;
- or the document is moved to an archive with an explicit replacement reference.

Version number alone does not establish authority.

### Example

`docs/archive/knowledge-operations/v2/KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V2.md` is proposed and therefore does not govern production architecture until approved. Its `supersedes` declaration does not make V1 non-governing unless V2 itself is approved by the proper authority.

## 12. Operating models, interfaces, and mission documents

### Scope

These documents define how an approved architecture operates without redefining the architecture itself.

### Governing examples

- `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`
- `docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md`
- `docs/chief-agent/CHIEF_AGENT_INTERFACE.md`

### Approval status

These are approved within their stated scope.

### Rule

They govern operating behavior, mission lifecycle, interface responsibilities, and human approval boundaries, but remain subordinate to Canon, Constitution, Blueprint, approved ADRs, and Chief Agent architecture.

## 13. Governance documents

### Scope

Governance documents define review, approval, reconciliation, operating process, and accountability.

### Rule

Governance controls process and authority execution. It does not silently redefine platform architecture.

Where a governance document and architecture document conflict:

- governance controls approval and process;
- architecture controls technical structure;
- Constitution controls both where explicitly stated.

## 14. Programs and roadmaps

### Scope

Programs and roadmaps define intended sequence, milestones, and future work.

### Approval status

They guide execution but do not prove implementation or final architecture.

### Rule

A roadmap item marked complete is not authoritative evidence of implementation unless supported by code, validation, certification, or reconciliation.

## 15. Validation, certification, and closeout documents

### Scope

These documents record whether a defined contract passed specified checks at a particular branch, commit, version, or date.

### Rule

Certification proves validated state for the certified scope and evidence set. It does not establish new architecture unless an approved architecture document explicitly delegates that authority.

A certification becomes stale when its referenced implementation or governing contract changes materially.

## 16. Drafts, RFCs, research, audits, and proposals

### Scope

These documents support investigation, discussion, comparison, or future decisions.

### Approval status

Non-governing unless formally accepted and promoted.

### Rule

- RFCs are proposals until accepted and converted into an approved decision or governing document.
- Audits report evidence and findings but do not establish architecture by themselves.
- Research does not establish policy.
- Drafts do not supersede approved documents.

## 17. Historical and archived material

### Scope

Historical and archived documents preserve chronology, prior intent, failed approaches, reconstruction history, and institutional evidence.

### Approval status

Non-governing unless an active higher-authority document explicitly incorporates them.

### Rule

History is evidence. It is not current instruction.

Archived material must not be silently revived as active architecture.

## 18. Ownership rules

Every governing document must identify an owner or derive ownership from its repository domain.

Default ownership by domain:

- Canon and Constitution: Constitutional Office
- Blueprint and whole-platform architecture: Chief Systems Architect
- ADRs and EDRs: named decision owner and approving architecture authority
- Platform architecture: platform owner
- Subsystem specification: subsystem owner
- Reconciliation: owning architecture authority for the reconciled scope
- Governance: Governance Office or Constitutional Office according to scope
- Certification: certifying authority named in the record
- Historical records: Knowledge or Documentation stewardship

Missing ownership is an authority defect and must be recorded as `unclear`; it must not be guessed.

## 19. Approval-state vocabulary

The following repository statuses have these effects:

| Status | Authority effect |
|---|---|
| Canonical / Supreme | Governing at the highest repository level within scope |
| Authoritative | Governing within declared scope |
| Approved / Accepted | Governing within declared scope |
| Active | Governing unless contradicted by a higher authority or explicit successor |
| Frozen | Governing and structurally closed; changes require formal approval |
| Complete / Closeout | Final for the completed scope when reconciliation criteria are met |
| Proposed | Non-governing proposal |
| Draft | Non-governing working document |
| Review / Closeout Review | Evidence under review; not final unless the document explicitly declares final resulting authority |
| Superseded | Historical evidence only |
| Historical / Archived | Evidence only |
| Rejected | Non-governing decision history |
| Unclear / Needs Review | No authority may be inferred |

## 20. Conflict-resolution procedure

When two documents disagree:

1. Confirm both documents address the same scope.
2. Compare authority class using this hierarchy.
3. Compare explicit status and approval state.
4. Check for explicit `supersedes`, `superseded by`, amendment, ADR, or reconciliation language.
5. Confirm the named owner had authority over the disputed scope.
6. Prefer the narrower approved document only when the higher-level document delegates that scope and no contradiction exists.
7. Treat newer dates as supporting evidence, not decisive authority.
8. If authority remains equal or ambiguous, mark the conflict unresolved.
9. Escalate unresolved constitutional conflicts to constitutional reconciliation.
10. Escalate unresolved architectural conflicts to an approved ADR or architecture reconciliation.

No implementation may choose a preferred document silently.

## 21. Known authority conflicts requiring future reconciliation

This hierarchy records but does not resolve the following substantive conflicts:

- Multiple constitutional documents exist with overlapping scope.
- Chief Agent and Engineer Agent terminology are not consistently reconciled across governing architecture.
- Draft knowledge models coexist with implementation and reconciliations that claim frozen or production-ready subsystem status.
- Canonical promotion rules requiring human review conflict with code paths that automatically promote validated items.
- Proposed Knowledge Operations V2 text declares supersession while remaining proposed.
- Some reconciliation numbering is duplicated across different capability names.

These remain unresolved until handled by the proper authority process.

## 22. Final authority rule

When documents disagree, final authority belongs to the highest approved document that:

- governs the disputed scope;
- was approved by the proper owner;
- has not been explicitly superseded;
- and does not contradict a higher repository authority.

If no document satisfies all four conditions, the repository has an unresolved authority conflict.

The correct action is to record and reconcile the conflict, not to infer a winner.
