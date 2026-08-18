---
title: CA-001 Knowledge Package
status: Constitutional Amendment Record
authority: Constitutional Amendment
owner: Constitutional Office
version: 1.0.0
amendment_id: CA-001
approval_date: 2026-07-31
branch: inspect/runtime-certified-main
base_commit: c682506e2b2ddf7c8661606eb92d5af1bc098b30
related:
  - ../../canon/VISION_2050.md
  - ../00_PLATFORM_CONSTITUTION.md
  - ../../canon/CANONICAL_DOCUMENT_HIERARCHY.md
  - ../../governance/CONSTITUTIONAL_DOCUMENT_GOVERNANCE.md
  - ../reconciliation/CHIEF_AGENT_LEARNING_RECONCILIATION.md
  - ../reconciliation/KNOWLEDGE_PACKAGE_RECONCILIATION.md
  - ../CHIEF_AGENT_ARCHITECTURE.md
  - ../KP_ARCHITECTURAL_RECONCILIATION.md
  - ../knowledge-governance/reconciliation/KR-004_KNOWLEDGE_ARCHITECTURE_RECONCILIATION.md
  - ../CANONICAL_KNOWLEDGE_MODEL.md
  - ../knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md
  - ../knowledge-governance/EVIDENCE_MODEL.md
  - ../reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md
  - ../../constitution/AMENDMENT_PROCESS.md
---

# CA-001 — Knowledge Package

## Amendment identifier

`CA-001`

## Summary

This amendment record establishes the Knowledge Package as the constitutional unit of governed organizational knowledge used to carry validated, provenance-backed learning through canonical review, publication, Organizational Memory adaptation, and Chief Agent consumption.

It does not create a new subsystem. It closes the constitutional gap recorded by the Chief Agent Learning Reconciliation and the Knowledge Package Reconciliation.

## Previous wording

No governing constitutional document previously defined `Knowledge Package` as a first-class artifact.

## New wording

The Knowledge Package is the constitutional unit of governed organizational knowledge.

It preserves the evidence, provenance, scope, validation state, review state, confidence, relationships, lifecycle state, and intended consumer projections required for knowledge to move safely from Knowledge IR into canonical knowledge, Organizational Memory, and Chief Agent learning.

## Related RFC

**UNRESOLVED** — No related RFC is identified in the governing repository evidence reviewed for this amendment.

## Related ADR

**UNRESOLVED** — No approved ADR specifically defining the Knowledge Package is identified in the governing repository evidence reviewed for this amendment.

## Related reconciliation

- `docs/architecture/reconciliation/CHIEF_AGENT_LEARNING_RECONCILIATION.md`
- `docs/architecture/reconciliation/KNOWLEDGE_PACKAGE_RECONCILIATION.md`

## 1. Constitutional Authority

**DOCUMENTED FACT** — `docs/canon/VISION_2050.md`, sections **Our Long-Term Vision**, **The Future We Are Building**, **Organizational Evolution**, and **Engineering Intelligence**, establishes that engineering knowledge must not be lost, institutional memory must become a permanent strategic advantage, every mission must strengthen future engineering, and Engineering Intelligence emerges from institutional knowledge, runtime evidence, engineering decisions, mission history, human expertise, and artificial intelligence.

**DOCUMENTED FACT** — `docs/architecture/00_PLATFORM_CONSTITUTION.md`, Laws 6, 7, 9, 11, and 12, requires engineering evidence to become reusable knowledge, defines the Knowledge Platform as permanent engineering memory, requires historical work to be fed into KP, requires traceability through knowledge extraction and agent learning, and requires every implementation to produce both platform capability and engineer learning.

**DOCUMENTED FACT** — `docs/canon/CANONICAL_DOCUMENT_HIERARCHY.md`, sections **Engineering Decision Records and amendments**, **Canonical models**, and **Conflict-resolution procedure**, establishes that constitutional amendments must remain subordinate to Canon and Constitution, cannot silently redefine architecture, and must resolve authority through explicit scope and evidence.

**DOCUMENTED FACT** — `docs/governance/CONSTITUTIONAL_DOCUMENT_GOVERNANCE.md`, sections **Authority Classes**, **Approval States**, **Supersession Rules**, and **Conflict Resolution Procedure**, classifies constitutional amendments as higher authority than architecture and specifications when properly approved and scoped, while requiring unresolved conflicts to remain recorded.

**DOCUMENTED FACT** — `docs/constitution/AMENDMENT_PROCESS.md`, sections **When an Amendment Is Required**, **Amendment Lifecycle**, **Evidence Requirements**, and **Amendment Record**, requires evidence-driven amendment records with identifier, summary, motivation, evidence, previous wording, new wording, related RFC, related ADR, related reconciliation, and approval date.

**DOCUMENTED FACT** — `docs/architecture/reconciliation/CHIEF_AGENT_LEARNING_RECONCILIATION.md`, section **Knowledge Package**, records that no reviewed constitutional or approved architecture document defined the Knowledge Package as a first-class learning artifact.

**DOCUMENTED FACT** — `docs/architecture/reconciliation/KNOWLEDGE_PACKAGE_RECONCILIATION.md`, sections **Current Repository Definition**, **Constitutional Purpose**, **Canonical Definition**, **Constitutional Gaps**, and **Required Constitutional Amendments**, identifies the Knowledge Package as partially defined by surrounding contracts but constitutionally missing as a named artifact.

**CONSTITUTIONAL AMENDMENT** — This amendment derives authority from the cited Canon, Constitution, governance, reconciliation, and knowledge-model evidence and is limited to establishing a shared constitutional artifact across existing subsystems.

## 2. Reason for Amendment

**DOCUMENTED FACT** — `docs/architecture/reconciliation/KNOWLEDGE_PACKAGE_RECONCILIATION.md`, section **Current Repository Definition**, classifies the Knowledge Package as partially defined and implicit rather than constitutionally defined.

**DOCUMENTED FACT** — The same document, sections **Boundaries**, **Lifecycle**, **Trust Boundary**, and **Readiness**, records that Evidence, Knowledge IR, Canonical Knowledge, Organizational Memory, and Chief Agent learning exist as separate documented concepts but lack a single governed artifact linking them.

**DOCUMENTED FACT** — `docs/architecture/reconciliation/CHIEF_AGENT_LEARNING_RECONCILIATION.md`, sections **Complete Learning Pipeline**, **Knowledge IR**, **Knowledge Package**, **Organizational Memory**, and **Prerequisites for First Learning Cycle**, records that the first production learning cycle requires a traceable, governed transition between provisional IR, canonical knowledge, memory, and Chief Agent consumption.

**CONFLICT** — `apps/lumina-runtime/src/knowledge-preservation/bootstrap/KnowledgePreservationPlatform.ts` automatically promotes validated items through `canonicalKnowledgeStore.promoteAll(validated)`, while `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`, section **Human Approval Gates**, requires human approval for knowledge promotion to canonical status.

**CONSTITUTIONAL AMENDMENT** — The constitutional gap is the absence of a first-class governed artifact between validated Knowledge IR and downstream canonical, memory, and Chief Agent consumers.

## 3. Amendment Statement

**CONSTITUTIONAL AMENDMENT** — The Knowledge Package is the constitutional unit of governed organizational knowledge.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md`, sections **Core Rule**, **Evidence to Knowledge Flow**, and **Provenance Rule**, requires immutable, traceable evidence and requires every canonical knowledge item to reference evidence.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, sections **Purpose**, **Core Rule**, **Validation Responsibilities**, **Review Rule**, and **KPE Contract**, defines Knowledge IR as provisional candidate knowledge produced by compilers and subject to normalization, validation, relationship analysis, confidence assignment, and human review where required.

**DOCUMENTED FACT** — `docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md`, sections **Core Principle**, **Provenance**, **Confidence**, **Lifecycle**, and **Consumption Rule**, requires structured knowledge with provenance, confidence, relationships, lifecycle state, and canonical consumption through the Knowledge Platform.

**DOCUMENTED FACT** — `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md`, sections **Purpose**, **Responsibilities**, **Privacy Boundary**, and **Validation**, requires generalized, validated outputs before trusted organizational-memory consumption.

**DOCUMENTED FACT** — `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md`, sections **Relationship to the Knowledge Platform**, **Decision Boundaries**, and **Knowledge Lifecycle**, requires the Chief Agent to consume governed knowledge, preserve human approval, and treat canonical knowledge as distinct from evidence and candidate knowledge.

## 4. Constitutional Definition

### Identity

**CONSTITUTIONAL AMENDMENT** — A Knowledge Package is a governed organizational knowledge artifact assembled from one or more validated Knowledge IR items and their supporting immutable evidence references.

### Purpose

**CONSTITUTIONAL AMENDMENT** — Its purpose is to preserve the complete governance context required for safe downstream knowledge use: provenance, scope, confidence, relationships, validation results, review requirements, approval state, lifecycle state, and intended consumer projections.

### Scope

**CONSTITUTIONAL AMENDMENT** — A Knowledge Package may represent knowledge derived from repository, runtime, architecture, documentation, ADR, conversation, mission, engineering execution, incident, recovery, validation, build, or historical evidence, but only within the evidence scope and authority preserved by the package.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md`, sections **Evidence Types** and **Initial Evidence Sources**, documents these evidence categories.

### Ownership

**CONSTITUTIONAL AMENDMENT** — The Knowledge Preservation / Knowledge Platform boundary owns package assembly and lifecycle custody. Human governance owns canonical approval. Organizational Memory owns only its validated generalized projection. The Chief Agent owns neither evidence nor package truth; it consumes governed projections.

**DOCUMENTED FACT** — `docs/architecture/00_PLATFORM_CONSTITUTION.md`, Law 7, states KP observes, organizes, generalizes, validates, and teaches but does not own execution.

**DOCUMENTED FACT** — `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`, section **Human Approval Gates**, reserves canonical promotion for human approval.

**DOCUMENTED FACT** — `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md`, sections **Architecture** and **Responsibilities**, states Organizational Memory consumes generalized learning outputs, does not own Learning state, and does not replace governance approval.

### Lifecycle

**CONSTITUTIONAL AMENDMENT** — A Knowledge Package moves through creation, compilation, validation, review, promotion, publication, adaptation, learning, supersession, and retirement without losing provenance.

### Governance

**CONSTITUTIONAL AMENDMENT** — Package creation may be automated from validated IR. Canonical promotion may not bypass required human review. Every package must remain inspectable, attributable, reviewable, and traceable to evidence.

### Provenance

**CONSTITUTIONAL AMENDMENT** — Every Knowledge Package must preserve stable references to all source evidence and compiler metadata used to create it.

### Consumers

**CONSTITUTIONAL AMENDMENT** — Consumers may include Canonical Knowledge, Knowledge Graph, Semantic Search, Context Builder, Organizational Memory, Knowledge Operations, Mission System, Runtime Learning, and Chief Agent reasoning or planning, but each consumer receives only a governed projection appropriate to its scope.

### Producers

**CONSTITUTIONAL AMENDMENT** — Producers include the Knowledge Preservation pipeline after compiler, normalization, and validation stages, together with human reviewers where review is required. Missions and runtime systems produce evidence and learning outputs; they do not directly declare canonical package truth.

### Review requirements

**CONSTITUTIONAL AMENDMENT** — Human review is mandatory for conversation-derived decisions, principles, lessons, architecture-changing knowledge, canonical promotion, and any other category required by governing policy. Directly supported factual metadata may proceed without human review only where governing evidence rules explicitly permit it.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, section **Review Rule**, requires human review for conversation-derived decisions, principles, and lessons while allowing directly supported factual metadata to bypass review.

## 5. Constitutional Guarantees

**CONSTITUTIONAL AMENDMENT** — Provenance is preserved. Supporting authority: `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md`, **Core Rule** and **Provenance Rule**.

**CONSTITUTIONAL AMENDMENT** — Source evidence remains immutable. Supporting authority: `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md`, **Core Rule**.

**CONSTITUTIONAL AMENDMENT** — Knowledge remains traceable from package to evidence, compiler, validation, review, and promotion state. Supporting authority: `docs/architecture/00_PLATFORM_CONSTITUTION.md`, Law 11; `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Compiler Metadata** and **Evidence References**.

**CONSTITUTIONAL AMENDMENT** — Packages are reviewable before canonical promotion. Supporting authority: `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`, **Human Approval Gates**; `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Review Rule**.

**CONSTITUTIONAL AMENDMENT** — Package state is reproducible from referenced evidence and compiler metadata to the extent the referenced compiler version and evidence remain available. Supporting authority: `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Compiler Metadata**; `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md`, evidence checksum and content-reference requirements.

**CONSTITUTIONAL AMENDMENT** — Packages are governed and versioned through lifecycle state, supersession, and retained historical provenance. Supporting authority: `docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md`, **Lifecycle** and **Relationships**; `docs/canon/VISION_2050.md`, **KoreLumina Promise**.

## 6. Trust Boundary

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

**DOCUMENTED FACT** — Trust remains evidential, not canonical. Evidence is immutable source material; compiler output is provisional candidate knowledge. Authority: `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md`, **Purpose** and **Core Rule**; `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Purpose**.

### Knowledge IR → Knowledge Package

**CONSTITUTIONAL AMENDMENT** — Trust changes from provisional extraction to governed candidate assembly only after normalization, validation, evidence-reference verification, confidence justification, relationship analysis, and determination of review requirements. The package remains non-canonical.

### Knowledge Package → Canonical Knowledge

**CONSTITUTIONAL AMENDMENT** — Trust changes from governed candidate to approved organizational truth only after required human review and canonical promotion. Validation alone does not establish canonical authority.

**CONFLICT** — Current KPP code promotes validated items automatically, while approved Chief Agent governance requires human approval for canonical promotion.

### Canonical Knowledge → Organizational Memory

**CONSTITUTIONAL AMENDMENT** — Trust changes from approved knowledge to reusable organizational memory only after scope generalization, privacy enforcement, adapter transformation, and Organizational Memory validation.

**DOCUMENTED FACT** — `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md`, sections **Architecture**, **Privacy Boundary**, and **Validation**, requires generalized learning outputs, excludes customer intellectual property, and requires validation before downstream trust.

### Organizational Memory → Chief Agent

**CONSTITUTIONAL AMENDMENT** — Trust changes from reusable institutional memory to decision input. The Chief Agent may reason, recommend, plan, and coordinate from it, but may not treat memory as runtime truth, bypass human approval, or fabricate operational state.

**DOCUMENTED FACT** — `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md`, sections **Relationship to Runtime**, **Decision Boundaries**, and **Human Override**, preserves Runtime truth and human authority.

## 7. Lifecycle

1. **Creation** — Evidence is discovered and captured with stable identity, source, content reference, checksum, metadata, and relationships. **DOCUMENTED FACT** — `EVIDENCE_MODEL.md`, **Evidence Item** and **Evidence Lifecycle**.
2. **Compilation** — Narrow evidence-specific compilers emit Knowledge IR and preserve compiler metadata. **DOCUMENTED FACT** — `KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Compiler Rule**, **Output Rule**, and **Compiler Metadata**.
3. **Validation** — IR is normalized, checked for required fields, evidence validity, justified confidence, conflicts, and review requirements. **DOCUMENTED FACT** — `KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Normalization Responsibilities** and **Validation Responsibilities**.
4. **Package assembly** — Validated IR and supporting governance metadata are assembled into a Knowledge Package. **CONSTITUTIONAL AMENDMENT**.
5. **Review** — Human review occurs where required by source type, knowledge category, architecture impact, or canonical-promotion policy. **DOCUMENTED FACT** — `KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Review Rule**; `CHIEF_AGENT_OPERATING_MODEL.md`, **Human Approval Gates**.
6. **Promotion** — Approved package content becomes Canonical Knowledge. **CONSTITUTIONAL AMENDMENT**.
7. **Publication** — Governed canonical projections become available through the Knowledge Platform, graph, retrieval, and context surfaces. **INFERENCE** — Supported by `CANONICAL_KNOWLEDGE_MODEL.md`, **Consumption Rule**, and KR-004's documented dependency order.
8. **Adaptation** — Generalized, privacy-safe projections become Organizational Memory records and insights after validation. **DOCUMENTED FACT** — `KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md`, **Architecture**, **Privacy Boundary**, and **Validation**.
9. **Learning** — The Chief Agent consumes governed knowledge and memory to understand, plan, delegate, monitor, recover, learn, and improve. **DOCUMENTED FACT** — `CHIEF_AGENT_ARCHITECTURE.md`, **Primary Responsibilities** and **Relationship to the Knowledge Platform**.
10. **Retirement** — Packages and canonical items may be superseded or archived while evidence and provenance remain retained. **DOCUMENTED FACT** — `CANONICAL_KNOWLEDGE_MODEL.md`, **Lifecycle** and **Relationships**.

## 8. Governance

### Who may create

**CONSTITUTIONAL AMENDMENT** — The Knowledge Preservation pipeline may create packages from validated IR. Human contributors may submit evidence or review outcomes, but may not bypass package validation and provenance requirements.

### Who validates

**DOCUMENTED FACT** — Validation belongs to the Knowledge Preservation validation boundary, as defined by `KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, **Validation Responsibilities**, and reflected in the KPP pipeline.

### Who approves

**DOCUMENTED FACT** — Human authority approves canonical promotion and high-impact knowledge decisions. Authority: `CHIEF_AGENT_OPERATING_MODEL.md`, **Human Approval Gates**; `VISION_2050.md`, **Human Leadership**.

### Who promotes

**CONSTITUTIONAL AMENDMENT** — Promotion is a governed Knowledge Platform action executed only after required approval. Automated systems may perform the mechanical transition but may not supply missing constitutional authority.

### Who consumes

**DOCUMENTED FACT** — Knowledge Platform consumers include Engineer/Chief Agent, Knowledge Graph, retrieval, context, Knowledge Operations, and Organizational Memory according to `CANONICAL_KNOWLEDGE_MODEL.md`, **Consumption Rule**; `CHIEF_AGENT_ARCHITECTURE.md`, **Relationship to the Knowledge Platform**; `KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V1.md`, **Responsibilities**.

### Who retires

**CONSTITUTIONAL AMENDMENT** — Retirement or supersession requires the same governing authority appropriate to the package's canonical scope and must preserve historical provenance.

## 9. Consumer Projections

### Organizational Memory

**CONSTITUTIONAL AMENDMENT** — Receives generalized, privacy-safe, validated learning projections, not raw package contents by default. Governance and evidence references must remain traceable.

### Chief Agent

**CONSTITUTIONAL AMENDMENT** — Receives knowledge-backed context, recommendations, operational guidance, and memory projections appropriate to mission scope. It does not receive authority to bypass human approval or replace Runtime truth.

### Knowledge Graph

**CONSTITUTIONAL AMENDMENT** — Receives nodes, relationships, provenance references, lifecycle state, and supersession links derived from the package. Graph representation does not itself establish canonical authority.

### Semantic Search

**CONSTITUTIONAL AMENDMENT** — Receives indexed, scope-filtered package or canonical projections while preserving source and authority references. Search ranking does not establish truth.

### Context Builder

**CONSTITUTIONAL AMENDMENT** — Receives governed, scope-appropriate knowledge projections for AI-ready context assembly. It may not promote or rewrite package authority.

### Runtime Learning

**CONSTITUTIONAL AMENDMENT** — Runtime events, incidents, recovery outcomes, and validation results may contribute evidence and receive operational guidance projections. Runtime remains execution truth and does not become organizational memory by itself.

### Mission System

**CONSTITUTIONAL AMENDMENT** — Missions produce evidence, decisions, lessons, recovery anchors, and canonical candidates; later missions consume governed package projections. Mission completion does not itself establish canonical promotion.

## 10. Non-Goals

**CONSTITUTIONAL AMENDMENT** — A Knowledge Package is not raw evidence. Evidence remains immutable source material.

**CONSTITUTIONAL AMENDMENT** — It is not Knowledge IR. IR remains provisional compiler output.

**CONSTITUTIONAL AMENDMENT** — It is not Canonical Knowledge until required approval and promotion occur.

**CONSTITUTIONAL AMENDMENT** — It is not Organizational Memory. Organizational Memory is a validated, generalized, privacy-bounded projection.

**CONSTITUTIONAL AMENDMENT** — It is not runtime state. Runtime remains the source of execution truth.

**CONSTITUTIONAL AMENDMENT** — It is not a conversation transcript, mission, repository, document, compiler, agent, or implementation package.

**DOCUMENTED FACT** — `docs/architecture/packages/PACKAGE_REGISTRY.md`, section **Purpose**, defines implementation packages as where capabilities are implemented; those are distinct from this governed knowledge artifact.

## 11. Constitutional Impact

**CONSTITUTIONAL AMENDMENT** — The amendment affects only shared constitutional references and trust boundaries across:

- Knowledge Preservation Platform
- Knowledge Platform
- Evidence
- Knowledge IR
- Canonical Knowledge
- Knowledge Graph
- Semantic Search
- Context Builder
- Organizational Memory
- Knowledge Operations
- Chief Agent
- Mission System
- Runtime Learning
- historical recovery / Day-0 learning

It does not redesign or transfer ownership of these subsystems.

## 12. Required Repository Changes

**CONSTITUTIONAL AMENDMENT** — Future governing documents must reference the Knowledge Package consistently as the artifact between validated IR and canonical or consumer-specific projections.

**CONSTITUTIONAL AMENDMENT** — Canonical-promotion documentation must distinguish validation from approval and promotion.

**CONSTITUTIONAL AMENDMENT** — KPP, CKM, Knowledge IR, Organizational Memory, Knowledge Operations, Mission System, and Chief Agent documents must preserve the trust boundaries established here when next amended or reconciled.

**CONSTITUTIONAL AMENDMENT** — Documentation registries and traceability matrices must classify CA-001 as an amendment record.

No implementation change is authorized by this section.

## 13. Migration

**DOCUMENTED FACT** — Existing repository records use Evidence, Knowledge IR, Canonical Knowledge, learning outputs, memory records, and direct publishing without a first-class Knowledge Package artifact.

**CONSTITUTIONAL AMENDMENT** — Documentation migration is required so future reconciliations can classify existing records as evidence, IR, package candidates, canonical knowledge, or memory projections.

**CONSTITUTIONAL AMENDMENT** — Implementation migration may be required because current KPP code promotes validated IR directly. This amendment records that impact but does not authorize implementation.

**UNRESOLVED** — The repository does not constitutionally define whether existing canonical records must be backfilled into Knowledge Packages or grandfathered with provenance attestations.

## 14. Compatibility

### Current KPP

**CONFLICT** — Structurally compatible with compiler, normalization, validation, publishing, and canonical-store stages, but incompatible with direct automatic promotion when human approval is required.

### Organizational Memory

**DOCUMENTED FACT** — Compatible with the frozen adapter and validation boundaries because packages project generalized learning outputs rather than replacing Organizational Memory.

### Knowledge IR

**DOCUMENTED FACT** — Compatible because packages consume validated IR while preserving the rule that compilers do not write directly to canonical storage.

### Evidence

**DOCUMENTED FACT** — Compatible because evidence remains immutable and traceable rather than being replaced by the package.

### Runtime

**DOCUMENTED FACT** — Compatible because runtime remains operational truth and a source of evidence, not package authority.

### Chief Agent

**DOCUMENTED FACT** — Compatible because the Chief Agent already consumes canonical knowledge and organizational memory while remaining subject to human approval and Runtime truth.

## 15. Acceptance Criteria

This amendment is constitutionally accepted when:

1. The amendment record is committed under the repository's amendment mechanism.
2. Authority, motivation, previous wording, new wording, evidence, related reconciliations, and approval date are recorded.
3. The Knowledge Package is explicitly defined as governed and non-canonical before promotion.
4. Evidence, IR, package, canonical knowledge, Organizational Memory, and Chief Agent trust boundaries are explicit.
5. Human approval remains mandatory wherever existing governing documents require it.
6. Provenance, evidence immutability, traceability, reviewability, lifecycle state, and supersession are preserved.
7. No subsystem ownership or implementation behavior is silently redesigned.
8. Existing conflicts and unresolved migration questions remain recorded rather than silently resolved.

**CONSTITUTIONAL AMENDMENT** — CA-001 closes the constitutional-definition gap for the Knowledge Package only. It does not close the Canonical Knowledge ↔ Organizational Memory trust-boundary reconciliation identified as the next dependency.
