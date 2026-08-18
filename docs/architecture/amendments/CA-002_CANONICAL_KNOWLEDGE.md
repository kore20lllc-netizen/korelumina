---
title: CA-002 Canonical Knowledge
status: Constitutional Amendment Record
authority: Constitutional Amendment
owner: Constitutional Office
version: 1.0.0
amendment_id: CA-002
approval_date: 2026-07-31
branch: inspect/runtime-certified-main
base_commit: b0245c75de29bd74b65637ad4cabe2e226774de1
related:
  - ../../canon/VISION_2050.md
  - ../00_PLATFORM_CONSTITUTION.md
  - ../../governance/CONSTITUTIONAL_DOCUMENT_GOVERNANCE.md
  - ../reconciliation/CHIEF_AGENT_LEARNING_RECONCILIATION.md
  - ../reconciliation/KNOWLEDGE_PACKAGE_RECONCILIATION.md
  - CA-001_KNOWLEDGE_PACKAGE.md
  - ../CANONICAL_KNOWLEDGE_MODEL.md
  - ../KP_ARCHITECTURAL_RECONCILIATION.md
  - ../knowledge-governance/reconciliation/KR-004_KNOWLEDGE_ARCHITECTURE_RECONCILIATION.md
  - ../knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md
  - ../knowledge-governance/EVIDENCE_MODEL.md
  - ../reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md
  - ../CHIEF_AGENT_ARCHITECTURE.md
  - ../../constitution/AMENDMENT_PROCESS.md
---

# CA-002 — Canonical Knowledge

## Amendment identifier

`CA-002`

## Summary

This amendment establishes Canonical Knowledge as the constitutional trust anchor for governed organizational knowledge in KoreLumina.

It extends CA-001 by defining the authority, governance, trust guarantees, promotion model, and consumer contracts required when a Knowledge Package becomes authoritative knowledge.

It does not redesign KPP, Organizational Memory, Runtime, the Chief Agent, or the Knowledge Package.

## Previous wording

The repository defined canonical knowledge in Draft v1 models, approved operating guidance, and implementation contracts, but did not constitutionally define Canonical Knowledge as the platform trust anchor or fully define the governance transition into canonical authority.

## New wording

Canonical Knowledge is the constitutionally governed, approved, provenance-backed, reviewable, and lifecycle-controlled representation of organizational knowledge that lower-trust systems may consume as authoritative within its declared scope.

Canonical status does not replace Runtime truth, human authority, or the governing authority of Canon, Constitution, Blueprint, approved decisions, or approved architecture.

## Related RFC

**UNRESOLVED** — No governing repository evidence identifies an approved RFC specifically establishing Canonical Knowledge as the constitutional trust anchor.

## Related ADR

**UNRESOLVED** — No governing repository evidence identifies an approved ADR specifically establishing the constitutional promotion and revocation model for Canonical Knowledge.

## Related reconciliation

- `docs/architecture/reconciliation/CHIEF_AGENT_LEARNING_RECONCILIATION.md`
- `docs/architecture/reconciliation/KNOWLEDGE_PACKAGE_RECONCILIATION.md`

## 1. Constitutional Authority

**DOCUMENTED FACT** — `docs/canon/VISION_2050.md`, sections **Our Long-Term Vision**, **The Future We Are Building**, **Organizational Evolution**, and **Engineering Intelligence**, requires permanent institutional memory, mission compounding, engineering intelligence, and permanent human governance.

**DOCUMENTED FACT** — `docs/architecture/00_PLATFORM_CONSTITUTION.md`, Laws 6, 7, 9, 11, and 12, requires engineering evidence to become reusable knowledge, defines the Knowledge Platform as permanent engineering memory, requires historical work to be fed into KP, and requires knowledge extraction and agent learning in the traceability chain.

**DOCUMENTED FACT** — `docs/governance/CONSTITUTIONAL_DOCUMENT_GOVERNANCE.md`, sections **Authority Classes**, **Approval States**, **Supersession Rules**, and **Conflict Resolution Procedure**, requires authority to depend on scope, approval, ownership, explicit supersession, and constitutional precedence rather than chronology.

**DOCUMENTED FACT** — `docs/architecture/reconciliation/CHIEF_AGENT_LEARNING_RECONCILIATION.md`, sections **Complete Learning Pipeline**, **Knowledge IR**, **Organizational Memory**, **Conflicts**, and **Prerequisites for First Learning Cycle**, records that canonical promotion governance is a prerequisite for production learning and that implementation currently conflicts with human approval rules.

**DOCUMENTED FACT** — `docs/architecture/reconciliation/KNOWLEDGE_PACKAGE_RECONCILIATION.md`, sections **Trust Boundary**, **Canonical Promotion**, **Constitutional Gaps**, and **Required Constitutional Amendments**, identifies the unresolved transition from governed Knowledge Package to Canonical Knowledge.

**DOCUMENTED FACT** — `docs/architecture/amendments/CA-001_KNOWLEDGE_PACKAGE.md`, sections **Constitutional Definition**, **Trust Boundary**, **Lifecycle**, and **Governance**, establishes the Knowledge Package as the governed non-canonical artifact immediately preceding canonical promotion.

**DOCUMENTED FACT** — `docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md`, sections **Core Principle**, **Provenance**, **Confidence**, **Lifecycle**, **Relationships**, and **Consumption Rule**, defines structured knowledge with provenance, confidence, relationships, lifecycle state, and canonical consumption through KP.

**DOCUMENTED FACT** — `docs/architecture/KP_ARCHITECTURAL_RECONCILIATION.md`, sections **Original KP Vision**, **Current Implementation Summary**, **Ticket Audit**, and **Phase 0 Closeout Status**, establishes KP as the learning substrate while recording Decision Memory, Semantic Search, Context Builder, and Learning Pipeline as incomplete.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/reconciliation/KR-004_KNOWLEDGE_ARCHITECTURE_RECONCILIATION.md`, embedded governing source **ENGINEERING_INTELLIGENCE_PLATFORM.md**, establishes the dependency order Governance → Knowledge → Graph → Retrieval → Context → Learning → Reasoning → Agent and the principle that knowledge precedes reasoning.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, sections **Purpose**, **Core Rule**, **Validation Responsibilities**, **Review Rule**, and **KPE Contract**, defines IR as provisional candidate knowledge and requires review where applicable before canonicalization.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md`, sections **Core Rule**, **Evidence to Knowledge Flow**, **Review Rule**, and **Provenance Rule**, requires immutable evidence, traceability, and at least one evidence reference for every canonical item.

**DOCUMENTED FACT** — `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md`, sections **Architecture**, **Responsibilities**, **Privacy Boundary**, and **Validation**, requires generalized, privacy-safe, validated memory projections and prohibits Organizational Memory from replacing governance approval.

**DOCUMENTED FACT** — `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md`, sections **Relationship to the Knowledge Platform**, **Relationship to Runtime**, **Decision Boundaries**, **Human Override**, and **Knowledge Lifecycle**, requires the Chief Agent to consume governed knowledge while preserving Runtime truth and human authority.

**CONSTITUTIONAL AMENDMENT** — This amendment derives only from the cited governing authority and is limited to constitutionalizing Canonical Knowledge as the trust anchor shared by existing subsystems.

## 2. Reason for Amendment

**DOCUMENTED FACT** — `docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md`, section **Status**, marks the model `Draft v1`, so its semantics alone do not constitute final constitutional authority.

**DOCUMENTED FACT** — `docs/architecture/amendments/CA-001_KNOWLEDGE_PACKAGE.md`, sections **Trust Boundary** and **Lifecycle**, establishes that a Knowledge Package remains non-canonical until governed promotion.

**DOCUMENTED FACT** — `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`, section **Human Approval Gates**, requires human approval for knowledge promotion to canonical status.

**CONFLICT** — `apps/lumina-runtime/src/knowledge-preservation/bootstrap/KnowledgePreservationPlatform.ts` calls `canonicalKnowledgeStore.promoteAll(validated)` immediately after validation, while the approved operating model requires human approval for canonical promotion.

**CONFLICT** — `apps/lumina-runtime/src/canonical-knowledge/KnowledgePromotionPolicy.ts` promotes every non-rejected IR item with confidence at or above `0.5`; it does not represent human approval, package approval state, authority scope, or review completion.

**DOCUMENTED FACT** — `apps/lumina-runtime/src/canonical-knowledge/KnowledgePromoter.ts` sets status to `canonical` directly and preserves evidence references, confidence, relationships, and metadata, but does not record approver, review decision, governing authority, publication state, or revocation authority.

**CONSTITUTIONAL AMENDMENT** — The constitutional gap is the absence of an approved definition of what canonical authority means, who grants it, what guarantees attach to it, and what downstream consumers may assume.

## 3. Constitutional Definition

### Identity

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge is the constitutionally governed representation of organizational knowledge that has passed required validation, review, approval, and promotion and may be relied upon as authoritative within its declared scope.

### Purpose

**CONSTITUTIONAL AMENDMENT** — Its purpose is to provide a stable trust anchor between governed Knowledge Packages and downstream systems that retrieve, relate, adapt, reason from, plan from, or learn from organizational knowledge.

### Scope

**CONSTITUTIONAL AMENDMENT** — Canonical authority applies only to the declared knowledge scope, evidence set, version, relationships, confidence basis, approval decision, and lifecycle state preserved by the canonical record.

### Ownership

**CONSTITUTIONAL AMENDMENT** — The Knowledge Platform owns custody, publication, lifecycle tracking, and traceability of Canonical Knowledge. Human governance owns canonical approval. No compiler, validator, runtime process, Organizational Memory provider, or Chief Agent may independently grant canonical authority.

**DOCUMENTED FACT** — `docs/architecture/00_PLATFORM_CONSTITUTION.md`, Law 7, assigns KP the responsibility to observe, organize, generalize, validate, and teach while excluding execution ownership.

**DOCUMENTED FACT** — `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`, section **Human Approval Gates**, reserves canonical promotion for human approval.

### Authority

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge is authoritative organizational knowledge within its declared scope, but remains subordinate to Human Leadership, Canon, Constitution, Blueprint, approved ADRs/EDRs, and governing architecture.

**DOCUMENTED FACT** — `docs/governance/CONSTITUTIONAL_DOCUMENT_GOVERNANCE.md`, sections **Authority Classes** and **Conflict Resolution Procedure**, requires lower authority to remain subordinate to higher governing documents.

### Guarantees

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge guarantees preserved provenance, immutable source evidence references, explicit lifecycle state, reviewability, approval traceability, scope limitation, supersession history, and consumer-visible trust status.

**DOCUMENTED FACT** — `docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md`, sections **Provenance**, **Confidence**, **Lifecycle**, and **Relationships**, provides the repository basis for provenance, confidence, state, and supersession relationships.

## 4. Relationship Model

```text
Evidence
↓
Knowledge IR
↓
Knowledge Package
↓
Canonical Knowledge
↓
Organizational Memory
↓
Chief Agent
```

### Evidence → Knowledge IR

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md`, sections **Purpose** and **Core Rule**, defines Evidence as immutable source material rather than knowledge.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, sections **Purpose** and **Core Rule**, defines IR as provisional candidate knowledge emitted by compilers.

**CONSTITUTIONAL AMENDMENT** — This transition creates candidate meaning but grants no canonical authority.

### Knowledge IR → Knowledge Package

**DOCUMENTED FACT** — `docs/architecture/amendments/CA-001_KNOWLEDGE_PACKAGE.md`, sections **Constitutional Definition** and **Trust Boundary**, establishes the Knowledge Package as the governed assembly of validated IR and supporting evidence, scope, confidence, relationships, and review state.

**CONSTITUTIONAL AMENDMENT** — This transition creates a governed review artifact but grants no canonical authority.

### Knowledge Package → Canonical Knowledge

**CONSTITUTIONAL AMENDMENT** — This is the canonical trust transition. It requires eligibility, completed validation, required review, authorized human approval, recorded promotion, and publication with preserved provenance.

**CONFLICT** — Current implementation treats policy evaluation and confidence threshold as sufficient for promotion; governing documentation requires human approval.

### Canonical Knowledge → Organizational Memory

**DOCUMENTED FACT** — `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md`, sections **Architecture**, **Responsibilities**, **Privacy Boundary**, and **Validation**, requires generalized learning outputs, privacy enforcement, and validation before memory output is trusted downstream.

**CONSTITUTIONAL AMENDMENT** — Organizational Memory receives an adapted, generalized, privacy-safe projection. It does not determine whether the source knowledge is canonical and may not broaden its authority beyond the source scope.

### Organizational Memory → Chief Agent

**DOCUMENTED FACT** — `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md`, section **Relationship to the Knowledge Platform**, lists Organizational Memory as a Chief Agent knowledge input.

**CONSTITUTIONAL AMENDMENT** — The Chief Agent receives trusted decision input, not authority to rewrite canonical status, fabricate runtime state, or bypass human approval.

## 5. Canonical Promotion

### Eligibility

**CONSTITUTIONAL AMENDMENT** — A Knowledge Package is eligible for canonical review only when required evidence references, provenance, scope, relationships, confidence basis, validation results, review classification, and lifecycle state are complete.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, sections **IR Item**, **Evidence References**, **Compiler Metadata**, and **Validation Responsibilities**, establishes these prerequisites for candidate knowledge.

### Review

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, section **Review Rule**, requires human review for conversation-derived decisions, principles, and lessons.

**DOCUMENTED FACT** — `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`, section **Human Approval Gates**, requires human approval for canonical promotion.

**CONSTITUTIONAL AMENDMENT** — Review must determine whether evidence supports the claim, scope is correct, confidence is justified, conflicts are recorded, and promotion authority exists.

### Approval

**CONSTITUTIONAL AMENDMENT** — Canonical approval belongs to authorized human governance. Approval must identify approver, authority, decision time, reviewed package version, and approval scope.

### Promotion

**CONSTITUTIONAL AMENDMENT** — Promotion changes a governed Knowledge Package from non-canonical candidate status into Canonical Knowledge. Validation alone is insufficient.

### Publication

**CONSTITUTIONAL AMENDMENT** — Publication makes the approved canonical record available to governed consumers through KP, graph, retrieval, context, memory adaptation, and Chief Agent knowledge access while preserving scope and lifecycle state.

### Rejection

**CONSTITUTIONAL AMENDMENT** — Rejected packages remain governed historical evidence and may not be exposed as canonical. Rejection must preserve the reviewed version, reason, and authority.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, section **Candidate Status**, includes `rejected` as a candidate state.

### Revision

**CONSTITUTIONAL AMENDMENT** — Revision produces a new reviewable package version. It does not silently mutate an approved canonical record.

### Supersession and retirement

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge may be superseded or archived through an authorized lifecycle decision that preserves the previous record, replacement relationship, reason, and authority.

**DOCUMENTED FACT** — `docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md`, sections **Lifecycle** and **Relationships**, includes `superseded`, `archived`, and `supersedes`.

## 6. Trust Guarantees

**CONSTITUTIONAL AMENDMENT** — Provenance: every canonical record retains evidence references. Authority: `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md`, **Provenance Rule**.

**CONSTITUTIONAL AMENDMENT** — Reproducibility: canonical output must identify the reviewed package, source evidence, compiler metadata, and version required to reconstruct the promotion basis. Authority: `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Compiler Metadata**; `EVIDENCE_MODEL.md`, **Evidence Item**.

**CONSTITUTIONAL AMENDMENT** — Auditability: review, approval, promotion, supersession, and retirement decisions remain inspectable. Authority: `docs/architecture/00_PLATFORM_CONSTITUTION.md`, Law 11; `docs/chief-agent/CHIEF_AGENT_INTERFACE.md`, **Approval Center** and **Activity Center**.

**CONSTITUTIONAL AMENDMENT** — Reviewability: canonical authority may not arise from an opaque or unreviewable transformation. Authority: `KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Review Rule**.

**CONSTITUTIONAL AMENDMENT** — Scope authority: consumers may trust only the declared scope and version. Authority: `docs/governance/CONSTITUTIONAL_DOCUMENT_GOVERNANCE.md`, **Conflict Resolution Procedure**.

**CONSTITUTIONAL AMENDMENT** — Version and lifecycle visibility: canonical, superseded, and archived states must remain distinguishable. Authority: `CANONICAL_KNOWLEDGE_MODEL.md`, **Lifecycle**; implementation evidence `CanonicalKnowledgeItem.ts` defines `canonical`, `superseded`, and `archived` states.

**CONSTITUTIONAL AMENDMENT** — Traceability: canonical knowledge remains connected to evidence, relationships, validation, and governing authority. Authority: Platform Constitution Law 11 and CKM **Provenance**.

## 7. Governance

### Propose

**CONSTITUTIONAL AMENDMENT** — KPP or an authorized human actor may propose a Knowledge Package for canonical review. Compilers, missions, runtime systems, and agents may produce evidence or candidates but may not self-grant canonical status.

### Review

**CONSTITUTIONAL AMENDMENT** — Authorized reviewers evaluate evidence sufficiency, provenance, scope, conflicts, confidence, review requirements, and alignment with governing authority.

### Approve

**CONSTITUTIONAL AMENDMENT** — Authorized human governance approves or rejects canonical promotion.

### Publish

**CONSTITUTIONAL AMENDMENT** — The Knowledge Platform publishes only approved canonical records and preserves approval metadata and lifecycle state.

### Revoke

**UNRESOLVED** — The repository does not define a named constitutional revocation authority or procedure for Canonical Knowledge.

### Supersede

**CONSTITUTIONAL AMENDMENT** — An authorized approval decision may supersede Canonical Knowledge when a replacement record explicitly identifies the prior record and preserves history.

### Retire

**UNRESOLVED** — The repository supports `archived` lifecycle state but does not constitutionally name the authority that may retire canonical records.

## 8. Consumer Contracts

### Organizational Memory

**CONSTITUTIONAL AMENDMENT** — Receives generalized, privacy-safe, scope-preserving projections of canonical or otherwise validated learning outputs. It may validate adaptation quality but may not confer canonical authority or retain prohibited customer intellectual property.

### Knowledge Graph

**CONSTITUTIONAL AMENDMENT** — Receives canonical entities, relationships, provenance links, scope, lifecycle state, and supersession relationships. Graph connectivity does not increase authority beyond the canonical source record.

### Semantic Search

**CONSTITUTIONAL AMENDMENT** — Receives searchable canonical projections with trust state, scope, provenance, version, and lifecycle filters. Retrieval relevance does not change canonical authority.

### Context Builder

**CONSTITUTIONAL AMENDMENT** — Receives canonical and explicitly classified non-canonical context with trust labels preserved. It may assemble context but may not erase provenance, scope, conflicts, or lifecycle state.

### Chief Agent

**CONSTITUTIONAL AMENDMENT** — Receives canonical knowledge and governed memory projections as decision inputs. It may understand, recommend, plan, delegate, and learn, but must preserve human approval, repository governance, and Runtime truth.

### Mission System

**CONSTITUTIONAL AMENDMENT** — Receives canonical guidance relevant to mission definition, planning, validation, recovery, and knowledge extraction. Mission completion produces new evidence and packages, not automatic canonical truth.

### Runtime Learning

**CONSTITUTIONAL AMENDMENT** — Receives canonical operational guidance while Runtime events remain the authority for current execution state. Runtime evidence may support new packages but may not be rewritten by canonical knowledge.

## 9. Non-Goals

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge is not raw Evidence. Authority: `EVIDENCE_MODEL.md`, **Purpose**.

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge is not Knowledge IR. Authority: `KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Purpose**.

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge is not an unapproved or draft Knowledge Package. Authority: CA-001 **Trust Boundary**.

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge is not current Runtime state. Authority: `CHIEF_AGENT_ARCHITECTURE.md`, **Relationship to Runtime**.

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge is not a raw conversation transcript. Authority: `EVIDENCE_MODEL.md`, **Conversation Evidence**.

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge is not merely an implementation artifact or source file. Those are evidence sources unless governed promotion occurs. Authority: `CANONICAL_KNOWLEDGE_MODEL.md`, **Evidence** and **Consumption Rule**.

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge is not Organizational Memory. Organizational Memory is a validated, generalized stewardship and adaptation layer with separate privacy and validation boundaries.

## 10. Constitutional Invariants

**CONSTITUTIONAL AMENDMENT** — Canonical Knowledge is never established by inference alone; it requires evidence, validation, and authorized promotion.

**CONSTITUTIONAL AMENDMENT** — Knowledge without evidence cannot become canonical. Authority: `EVIDENCE_MODEL.md`, **Provenance Rule**.

**CONSTITUTIONAL AMENDMENT** — Validation does not replace required human approval. Authority: `CHIEF_AGENT_OPERATING_MODEL.md`, **Human Approval Gates**.

**CONSTITUTIONAL AMENDMENT** — Canonical status is scope-bound and lifecycle-visible.

**CONSTITUTIONAL AMENDMENT** — Supersession and retirement preserve history rather than rewriting it. Authority: CKM **Lifecycle** and **Relationships**.

**CONSTITUTIONAL AMENDMENT** — Organizational Memory does not determine canonical authority. Authority: KP-014 **Responsibilities**.

**CONSTITUTIONAL AMENDMENT** — The Chief Agent consumes canonical knowledge but does not own its approval authority. Authority: `CHIEF_AGENT_ARCHITECTURE.md`, **Decision Boundaries** and **Human Override**.

**CONSTITUTIONAL AMENDMENT** — Runtime truth remains authoritative for current execution state. Authority: `CHIEF_AGENT_ARCHITECTURE.md`, **Relationship to Runtime**.

## 11. Compatibility

### CA-001

**DOCUMENTED FACT** — Compatible. CA-001 defines the Knowledge Package as the governed non-canonical artifact; CA-002 defines the promotion result and trust guarantees without redefining the package.

### KPP

**CONFLICT** — Structurally compatible with compiler, normalization, validation, promotion, publishing, and canonical-store foundations, but current automatic promotion conflicts with human approval and package-governance requirements.

### Knowledge IR

**DOCUMENTED FACT** — Compatible. IR remains provisional candidate knowledge and feeds packages rather than becoming canonical directly.

### Evidence Model

**DOCUMENTED FACT** — Compatible. Evidence remains immutable and traceable; canonical records retain evidence references.

### Organizational Memory

**DOCUMENTED FACT** — Compatible with its frozen responsibility, privacy, adapter, and validation boundaries. CA-002 does not make Organizational Memory the canonical authority.

### Runtime

**DOCUMENTED FACT** — Compatible because Runtime retains authority for current execution truth and provides evidence rather than canonical declarations.

### Chief Agent

**DOCUMENTED FACT** — Compatible because the Chief Agent consumes governed knowledge while preserving human authority, validation, explainability, and Runtime truth.

## 12. Migration

**CONSTITUTIONAL AMENDMENT** — Existing canonical records require constitutional classification against evidence references, reviewed package or candidate source, approval state, scope, lifecycle status, and promotion authority before they may be treated as compliant Canonical Knowledge.

**CONSTITUTIONAL AMENDMENT** — Existing records created solely through confidence-threshold policy must not be presumed constitutionally approved without review evidence.

**CONSTITUTIONAL AMENDMENT** — Existing Organizational Memory records require traceability to their source canonical or validated learning artifact and privacy/validation evidence.

**CONSTITUTIONAL AMENDMENT** — Existing downstream consumers require trust labels that distinguish evidence, IR, packages, canonical knowledge, memory projections, superseded records, and archived records.

No implementation migration is performed by this amendment.

## 13. Affected Subsystems

**DOCUMENTED FACT** — Knowledge Preservation Platform: promotion and publication contracts are constitutionally constrained.

**DOCUMENTED FACT** — Canonical Knowledge Store and Registry: custody, lifecycle, and trust metadata are affected.

**DOCUMENTED FACT** — Knowledge Operations: canonical review, approval, rejection, promotion, supersession, and audit visibility are affected.

**DOCUMENTED FACT** — Knowledge Graph: canonical entity and relationship trust labels are affected.

**DOCUMENTED FACT** — Semantic Search and Context Builder: retrieval and context trust assumptions are affected.

**DOCUMENTED FACT** — Organizational Memory: source authority, adaptation, privacy, and validation traceability are affected.

**DOCUMENTED FACT** — Chief Agent, Mission System, Reasoning, and Planning: consumer trust contracts are affected.

**DOCUMENTED FACT** — Runtime Learning: operational guidance may be canonical, while current runtime state remains separate.

This amendment does not redesign any affected subsystem.

## 14. Remaining Constitutional Gaps

**UNRESOLVED** — Constitutional owner and procedure for Canonical Knowledge revocation.

**UNRESOLVED** — Constitutional owner and procedure for canonical retirement/archive decisions.

**UNRESOLVED** — Canonical Knowledge ↔ Organizational Memory stewardship, refresh, correction, and invalidation contract beyond the existing adapter and validation boundary.

**UNRESOLVED** — Engineer Agent ↔ Chief Agent relationship and which consumes canonical knowledge at each organizational layer.

**UNRESOLVED** — Formal constitutional contracts for Semantic Search, Context Builder, Reasoning, and Planning remain incomplete.

**UNRESOLVED** — Genesis, Day-0 learning, and historical replay governance remain undefined.

**CONFLICT** — Automatic implementation promotion remains inconsistent with human canonical approval.

**UNRESOLVED** — The authoritative human role or body that performs canonical approval is not named beyond human governance.

## 15. Acceptance Criteria

This amendment is constitutionally accepted only when:

- its authority remains traceable to the governing sources listed in Section 1;
- Canonical Knowledge is defined as an approved, scope-bound, provenance-backed constitutional trust anchor;
- CA-001 remains unchanged and the Knowledge Package remains non-canonical until promotion;
- Evidence and Knowledge IR remain lower-trust artifacts;
- promotion requires validation, applicable review, authorized human approval, recorded promotion, and publication;
- rejection, revision, supersession, and retirement preserve history and provenance;
- Organizational Memory remains a separate generalized, privacy-safe, validated adaptation layer;
- the Chief Agent remains a governed consumer rather than canonical approval authority;
- Runtime truth remains authoritative for current execution state;
- implementation conflicts and unresolved ownership questions remain explicitly recorded rather than silently resolved;
- no implementation, Runtime, KPP, Organizational Memory, Chief Agent, Vision, or Constitution behavior is modified by this document.
