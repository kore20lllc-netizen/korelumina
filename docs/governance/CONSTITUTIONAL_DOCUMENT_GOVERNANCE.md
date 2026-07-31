---
title: Constitutional Documentation Governance
status: Audit
owner: Constitutional Office
authority: Governance
version: 1.0.0
audit_date: 2026-07-31
branch: inspect/runtime-certified-main
head: 5b8627ff5095ae40e75c260793274441382187a2
related:
  - ../canon/README.md
  - ../canon/CANONICAL_DOCUMENT_HIERARCHY.md
  - ../README.md
  - ../architecture/00_PLATFORM_CONSTITUTION.md
  - ../architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE.md
  - ../architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE_AUDIT.md
---

# Constitutional Documentation Governance

## 1. Repository State

Branch: `inspect/runtime-certified-main`

HEAD Commit: `5b8627ff5095ae40e75c260793274441382187a2`

Audit Date: `2026-07-31`

**DOCUMENTED FACT** — `docs/canon/README.md`, section **Authority**, states that repository authority flows from Human Leadership to Canon, Constitution, Blueprint, Engineering Decision Records, Architecture, Specifications, and Implementation.

**DOCUMENTED FACT** — `docs/README.md`, section **Repository Knowledge Hierarchy**, states that higher layers govern lower layers and lower layers must never contradict higher layers.

## 2. Governance Purpose

**DOCUMENTED FACT** — `docs/canon/README.md`, sections **Purpose** and **Authority**, distinguishes the Canon from architecture, specifications, and implementation by assigning the Canon responsibility for permanent identity and the highest repository authority beneath human leadership.

**DOCUMENTED FACT** — `docs/README.md`, sections **Architecture**, **Specifications**, **History**, and **Research**, distinguishes:

- governing documents: Canon, Constitution, Blueprint, approved decisions, architecture, and specifications;
- descriptive documentation: architecture and specifications describing structure and capability contracts;
- implementation documentation: implementation logs, validation, certification, and operational records describing realized state;
- historical documentation: history and archives preserving chronology and context without automatically governing current work.

**DOCUMENTED FACT** — `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE.md`, sections **Document Authority Order** and **Knowledge Governance Rule**, states that active documents guide engineering while archived and historical documents preserve context and do not govern unless explicitly referenced by an active document.

**INFERENCE** — The constitutional documentation model is designed to prevent chronology, filename prominence, or implementation state from becoming authority by accident. This follows from the repeated repository rule that authority depends on document class, approval status, scope, and explicit supersession.

## 3. Authority Classes

### 3.1 Canon

Definition: Permanent identity, purpose, values, long-term direction, and enduring truths.

Decision Authority: Supreme repository authority beneath human leadership for organizational identity and direction.

Scope: Organization-wide.

Repository Evidence: `docs/canon/README.md`, sections **Authority**, **Canonical Documents**, and **Characteristics of Canonical Documents**.

Owner: Constitutional Office, from document metadata.

May Override: Constitution, Blueprint, decisions, architecture, specifications, and implementation when those contradict Canon.

May Not Override: Human leadership.

**DOCUMENTED FACT**

### 3.2 Constitution

Definition: Governance, authority, principles, engineering law, organizational structure, and mandatory platform laws.

Decision Authority: Governs all engineering activity and lower-level documentation within explicit scope.

Scope: Organization-wide or platform-wide according to the constitutional artifact.

Repository Evidence: `docs/README.md`, section **Constitution**; `docs/architecture/00_PLATFORM_CONSTITUTION.md`, sections **Status**, **Core Laws**, and **Definition of Done**.

Owner: Constitutional Office where declared; overlapping constitutional ownership remains inconsistent elsewhere.

May Override: Blueprint, decisions, architecture, specifications, implementation, validation, certification, roadmaps, and historical records.

May Not Override: Canon or human leadership.

**DOCUMENTED FACT**

### 3.3 Blueprint

Definition: Whole-platform architectural map, domain model, strategic assets, and dependency structure.

Decision Authority: Governs whole-platform architecture and subsystem traceability.

Scope: Platform.

Repository Evidence: `docs/README.md`, section **Blueprint**; `docs/canon/README.md`, section **Relationship to the Constitution**.

Owner: Chief Systems Architect is documented in repository architecture conventions and in governing architecture metadata where present.

May Override: Lower-level architecture, specifications, roadmaps, and implementation within platform scope.

May Not Override: Canon, Constitution, or an approved constitutional amendment.

**DOCUMENTED FACT**

### 3.4 Approved ADR

Definition: An accepted architecture decision recording context, choice, trade-offs, and consequences.

Decision Authority: Governing within its explicit decision scope.

Scope: The bounded architecture or capability named by the ADR.

Repository Evidence: `docs/README.md`, section **Engineering Decision Records**; `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE_AUDIT.md`, section **Immediate Governance Decisions**, which states ADRs are authoritative unless superseded.

Owner: Named decision owner and approving architecture authority when documented.

May Override: Lower-level architecture or specifications only when explicit supersession is documented.

May Not Override: Canon, Constitution, or Blueprint outside delegated scope.

**DOCUMENTED FACT**

### 3.5 Approved EDR

Definition: Engineering Decision Record used by the repository to preserve significant engineering decisions.

Decision Authority: Equivalent to an approved architecture decision within its stated engineering scope.

Scope: Engineering architecture or execution policy named in the record.

Repository Evidence: `docs/README.md`, sections **Engineering Decision Records** and **Knowledge Lifecycle**.

Owner: Named decision owner and approving engineering authority when documented.

May Override: Lower-level specifications, implementation plans, or prior engineering guidance when explicit.

May Not Override: Canon, Constitution, Blueprint, or higher-scope approved architecture.

**INFERENCE** — The repository describes EDR authority conceptually but does not provide a fully reconciled EDR registry or universal status schema.

### 3.6 Governing Architecture

Definition: Approved, active, frozen, authoritative, or canonical architecture defining structure, boundaries, ownership, contracts, and dependency direction.

Decision Authority: Governing within declared architecture scope.

Scope: Platform or subsystem.

Repository Evidence: `docs/README.md`, section **Architecture**; `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md`, section **Status**; `docs/architecture/ARCHITECTURE_BASELINE_1_0.md` where applicable.

Owner: Declared architecture owner or responsible platform office.

May Override: Lower-level specifications, roadmaps, and implementation within scope.

May Not Override: Canon, Constitution, Blueprint, or an approved higher-scope ADR.

**DOCUMENTED FACT**

### 3.7 Final Reconciliation

Definition: A closeout or reconciliation artifact that compares intended architecture, implementation reality, approved deviations, remaining work, and final subsystem status.

Decision Authority: Governing for reconciled implementation reality within the declared scope when explicitly final, complete, closed, frozen, or approved.

Scope: Named epic, platform layer, or subsystem.

Repository Evidence: `docs/architecture/KP_ARCHITECTURAL_RECONCILIATION.md`, sections **Purpose**, **Reconciled Architecture V2**, and **Final Assessment**; `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md`, sections **Status**, **Reconciliation**, and **Architecture Freeze**.

Owner: Reconciliation authority for the named subsystem; often unclear when not declared.

May Override: Earlier roadmap assertions, implementation assumptions, and lower-level subsystem descriptions within scope.

May Not Override: Canon, Constitution, Blueprint, approved ADRs, or higher-scope governing architecture.

**DOCUMENTED FACT**

### 3.8 Frozen Specification

Definition: A specification explicitly marked frozen or approved and closed to structural change without formal authorization.

Decision Authority: Governing capability contract within declared scope.

Scope: Platform, subsystem, capability, workspace, or interface.

Repository Evidence: `docs/architecture/REPOSITORY_INTELLIGENCE_PLATFORM_SPECIFICATION_V1.md`, metadata and **Purpose**; frozen subsystem language in reconciliations such as `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md`.

Owner: Declared platform or subsystem owner.

May Override: Earlier lower-authority specifications or implementation guidance when explicit supersession exists.

May Not Override: Canon, Constitution, Blueprint, approved ADRs, or governing architecture.

**DOCUMENTED FACT**

### 3.9 Approved Operating Model

Definition: Approved description of how an existing architecture operates, including lifecycle, approvals, delegation, and recovery.

Decision Authority: Governs operating behavior within approved architecture.

Scope: Chief Agent, Mission System, governance workflow, or named operating domain.

Repository Evidence: `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`, sections **Status**, **Executive Loop**, **Human Approval Gates**, and **Learning Workflow**.

Owner: Named subsystem or executive owner; explicit owner metadata is absent in several approved operating documents.

May Override: Lower-level procedural guidance within scope.

May Not Override: Canon, Constitution, Blueprint, approved ADRs, or governing architecture.

**DOCUMENTED FACT**

### 3.10 Governance

Definition: Documents controlling review, approval, reconciliation, accountability, and process.

Decision Authority: Governs process and authority execution.

Scope: Organization-wide or a named governance domain.

Repository Evidence: `docs/governance/GOVERNANCE_MODEL.md`, `docs/governance/OPERATING_MODEL.md`, `docs/governance/RECONCILIATION_PROCESS.md`, and `docs/README.md`, section **Documentation Governance**.

Owner: Governance Office or Constitutional Office where declared; ownership is not consistently specified.

May Override: Lower-level process, review, and approval procedures.

May Not Override: Canon, Constitution, or technical architecture outside delegated governance scope.

**DOCUMENTED FACT**

### 3.11 Validation

Definition: Evidence that defined checks passed or failed for an implementation or document contract.

Decision Authority: Establishes validated state; does not define architecture.

Scope: Named build, runtime, subsystem, capability, or milestone.

Repository Evidence: `docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md`, sections **Mission Validation** and **Mission Lifecycle**; `docs/architecture/00_PLATFORM_CONSTITUTION.md`, section **Definition of Done**.

Owner: Validation authority or mission owner; frequently implicit.

May Override: Unsupported completion claims about validated state.

May Not Override: Canon, Constitution, Blueprint, ADRs, architecture, or specifications.

**DOCUMENTED FACT**

### 3.12 Certification

Definition: A scoped record that a subsystem or capability passed defined certification checks at a specific branch, commit, version, or date.

Decision Authority: Proves certification status for the evidence set; does not create architecture.

Scope: Named subsystem or capability.

Repository Evidence: `docs/certification/README.md`; `docs/runtime/RUNTIME_CERTIFICATION_REPORT.md`; `docs/architecture/LUMINA_DESIGN_SYSTEM_CERTIFICATION.md`.

Owner: Certifying authority named in the record where present.

May Override: Earlier certification status for the same scope when explicitly superseding and based on newer validated evidence.

May Not Override: Canon, Constitution, Blueprint, approved ADRs, governing architecture, or frozen specifications.

**DOCUMENTED FACT**

### 3.13 Roadmap

Definition: Intended sequence, milestones, and future work.

Decision Authority: Directs execution planning but does not prove completion or final architecture.

Scope: Program, platform, subsystem, or capability.

Repository Evidence: `docs/architecture/KP_ARCHITECTURAL_RECONCILIATION.md`, sections **Original KP Roadmap** and **Reconciled Architecture V2**; `docs/README.md`, section **Blueprint**.

Owner: Program or architecture owner where declared.

May Override: Earlier roadmaps when explicitly reconciled or replaced.

May Not Override: Canon, Constitution, Blueprint, approved ADRs, governing architecture, frozen specifications, or validated implementation evidence.

**DOCUMENTED FACT**

### 3.14 RFC

Definition: Proposal record for discussion and review.

Decision Authority: None until accepted and promoted.

Scope: Proposed change.

Repository Evidence: `docs/rfc/README.md`; `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE_AUDIT.md`, section **Immediate Governance Decisions**, which states RFCs are proposals unless accepted and converted into ADRs or canonical documents.

Owner: RFC author or sponsor.

May Override: Nothing while proposed.

May Not Override: Any governing document.

**DOCUMENTED FACT**

### 3.15 Audit

Definition: Evidence-based investigation of repository state, authority, compliance, or implementation.

Decision Authority: Reports findings; does not establish architecture by itself.

Scope: Named audit domain.

Repository Evidence: `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE_AUDIT.md`, sections **Status**, **Objective**, and **Findings**.

Owner: Audit author or responsible review office; often unspecified.

May Override: Nothing by itself.

May Not Override: Governing documents.

**DOCUMENTED FACT**

### 3.16 Research

Definition: Investigation that may influence future decisions.

Decision Authority: None until converted into an approved decision or governing document.

Scope: Research question.

Repository Evidence: `docs/README.md`, section **Research**.

Owner: Research author or sponsor.

May Override: Nothing.

May Not Override: Any governing document.

**DOCUMENTED FACT**

### 3.17 Historical

Definition: Records preserving organizational chronology, evolution, prior decisions, and lessons.

Decision Authority: None unless explicitly incorporated by an active governing document.

Scope: Historical period or event.

Repository Evidence: `docs/README.md`, section **History**.

Owner: Documentation or Knowledge stewardship; not consistently declared.

May Override: Nothing.

May Not Override: Active governing documents.

**DOCUMENTED FACT**

### 3.18 Archive

Definition: Material retained as evidence but not active guidance.

Decision Authority: None unless explicitly reactivated through an approved governing process.

Scope: Archived artifact.

Repository Evidence: `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE.md`, section **Knowledge Governance Rule**; `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE_AUDIT.md`, section **Immediate Governance Decisions**.

Owner: Documentation or Knowledge stewardship; frequently unspecified.

May Override: Nothing.

May Not Override: Active governing documents.

**DOCUMENTED FACT**

## 4. Approval States

| Approval State | Meaning | Repository Evidence | Transition Rules |
|---|---|---|---|
| Canonical | Highest enduring repository authority within scope | `docs/canon/README.md`, **Authority** and **Characteristics of Canonical Documents** | Changes require constitutional governance and preserved history |
| Authoritative | Governing within declared scope | `docs/architecture/00_PLATFORM_CONSTITUTION.md`, **Status** | Remains governing until explicitly superseded or amended |
| Approved | Accepted for use within scope | `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md`, **Status**; Chief Agent operating documents | May transition to superseded through explicit approved replacement |
| Active | Current guidance within scope | `docs/architecture/ENGINEERING_INTELLIGENCE_PLATFORM.md`, metadata quoted in KR-004 | Remains active unless superseded, archived, or contradicted by higher authority |
| Frozen | Structurally closed and governing | `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md`, **Architecture Freeze** | Changes require approved ticket, RFC, ADR, or named authority process |
| Complete | Completed scope, not automatically constitutional authority | KP closeout and reconciliation documents | Becomes historical when superseded; completion must remain evidence-backed |
| Proposed | Non-governing proposal | `docs/architecture/KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V2.md`, metadata | Requires approval before governing; proposal alone cannot supersede active guidance |
| Draft | Working, non-final document | CKM, Knowledge IR, Evidence Model, Documentation Architecture | Requires explicit approval, acceptance, or freeze to govern |
| Review | Under review and not final unless final authority is explicitly declared | `docs/architecture/KP_ARCHITECTURAL_RECONCILIATION.md`, **Phase 0 Closeout Review** | Requires closeout, approval, or freeze for finality |
| Superseded | Historical evidence only | ADR and specification conventions; Canonical hierarchy | Must identify a valid successor or superseding decision |
| Historical | Preserved chronology, non-governing | `docs/README.md`, **History** | Remains evidence; may be cited but not silently reactivated |
| Archived | Retained evidence, non-governing | Documentation Architecture and audit | Requires explicit active reference or approved restoration to influence current governance |
| Needs Review | Authority cannot be inferred | Documentation Architecture Audit classification vocabulary | Requires owner, status, scope, and approval evidence before classification |

**DOCUMENTED FACT** — The repository does not define a single machine-enforced transition state machine for all documentation.

**UNRESOLVED** — Whether `Complete` alone is sufficient to establish governing authority when the document lacks an explicit owner or approval authority.

## 5. Ownership

### Constitutional Office

Documented Responsibilities: Maintains Canon and constitutional identity; governs rare changes to canonical documents.

Authority: Supreme repository stewardship beneath human leadership.

Scope: Canon and Constitution.

Approval Rights: Constitutional review and approval of canonical changes.

Evidence: `docs/canon/README.md`, metadata and sections **Governance** and **Stewardship**.

**DOCUMENTED FACT**

### Chief Systems Architect

Documented Responsibilities: Owns whole-platform architecture and architecture specifications where named.

Authority: Architecture authority subordinate to Canon, Constitution, and Blueprint governance.

Scope: Platform and cross-subsystem architecture.

Approval Rights: Architecture approval where explicitly assigned.

Evidence: architecture document metadata such as Knowledge Operations V2 and repository architecture governance conventions.

**INFERENCE** — The role is repeatedly named, but a single constitutional role charter defining all approval rights was not found.

### Platform Owner

Documented Responsibilities: Owns platform contracts, boundaries, capabilities, dependencies, and extension points.

Authority: Governing within the named platform scope.

Scope: A platform such as Runtime, Repository Intelligence, Knowledge Platform, or Agent Platform.

Approval Rights: Platform specifications and scoped reconciliations when declared.

Evidence: platform specification metadata and package ownership rules in `docs/architecture/00_PLATFORM_CONSTITUTION.md`, section **Package Ownership Contract**.

**DOCUMENTED FACT**

### Subsystem Owner

Documented Responsibilities: Owns bounded subsystem implementation and specification within higher-level architecture.

Authority: Scoped and delegated.

Scope: Named subsystem or capability.

Approval Rights: Subsystem documents only where explicitly assigned.

Evidence: `docs/architecture/00_PLATFORM_CONSTITUTION.md`, sections **Capability Ownership Rules** and **Package Ownership Contract**.

**DOCUMENTED FACT**

### Governance Office

Documented Responsibilities: Review, approval process, reconciliation process, accountability, and policy administration where declared.

Authority: Process authority; not independent architecture authority.

Scope: Governance procedures.

Approval Rights: Governance approvals within delegated scope.

Evidence: `docs/governance/GOVERNANCE_MODEL.md`, `docs/governance/RECONCILIATION_PROCESS.md`, and `docs/README.md`, section **Documentation Governance**.

**UNRESOLVED** — A single repository document defining the Governance Office as a constitutional role with comprehensive approval rights was not found.

### Certification Authority

Documented Responsibilities: Certifies that a subsystem passed defined evidence and validation checks.

Authority: Certification status only.

Scope: Named certification.

Approval Rights: Certification issuance where named.

Evidence: certification record conventions in `docs/certification/README.md` and subsystem certification reports.

**INFERENCE** — Certification authority is record-specific and not established as a single repository-wide office.

### Documentation Stewardship

Documented Responsibilities: Preserve institutional knowledge, history, archives, and documentation quality.

Authority: Stewardship and classification, not architecture authority unless separately delegated.

Scope: Documentation and historical evidence.

Approval Rights: Not comprehensively documented.

Evidence: `docs/README.md`, sections **Purpose**, **History**, **Documentation Governance**, and **Documentation as Infrastructure**; `docs/canon/README.md`, section **Stewardship**.

**UNRESOLVED** — The repository does not define a single named Documentation Stewardship office with explicit approval boundaries.

## 6. Decision Authority Matrix

| Authority Class | May Define Mission | May Change Architecture | May Change Subsystems | May Override Constitution | May Introduce New Concepts |
|---|---:|---:|---:|---:|---:|
| Canon | Yes, at strategic identity level | Indirectly through higher-order direction | Indirectly | No | Yes, for enduring identity and direction |
| Constitution | Yes | Yes, through governing law | Yes | No | Yes, within constitutional scope |
| Blueprint | Yes, as strategic architecture | Yes, whole-platform | Yes, by defining domain structure | No | Yes, within platform architecture |
| Approved ADR | No, unless mission scope is part of decision | Yes, within explicit scope | Yes, within explicit scope | No | Yes, within explicit delegated scope |
| Approved EDR | No, unless explicitly scoped | Yes, within engineering scope | Yes, within engineering scope | No | Yes, within delegated scope |
| Governing Architecture | No | Yes, within declared scope | Yes | No | Yes, within delegated architecture scope |
| Final Reconciliation | No | Only to classify reconciled state within scope | Yes, within reconciled scope | No | No, unless an approved architecture authority explicitly adopts the result |
| Frozen Specification | No | No | Defines subsystem contract within scope | No | No beyond approved architecture |
| Approved Operating Model | Defines mission operation where delegated | No | Defines operating behavior | No | No beyond approved architecture |
| Governance | Defines approval and process rules | No, unless Constitution delegates | No, except governance procedures | No | No architecture concepts by itself |
| Validation | No | No | No | No | No |
| Certification | No | No | No | No | No |
| Roadmap | Plans missions | No | No | No | May propose, not govern |
| RFC | May propose | No | No | No | May propose, not govern |
| Audit | No | No | No | No | No; may identify gaps |
| Research | No | No | No | No | May investigate, not govern |
| Historical | No | No | No | No | No |
| Archive | No | No | No | No | No |

**INFERENCE** — Mission-definition authority is explicit for Vision, Blueprint, Chief Agent Mission System, and approved operating models, but not uniformly defined for every document class.

## 7. Scope Matrix

| Document | Scope | Authority | Status | Owner |
|---|---|---|---|---|
| `docs/canon/README.md` | Platform identity and repository authority | Canon | Canonical / Supreme | Constitutional Office |
| `docs/canon/VISION_2050.md` | Long-term organizational direction | Canon | Canonical / Supreme | Constitutional Office |
| `docs/canon/FOUNDING_CHARTER.md` | Founding purpose | Canon | Canonical | Constitutional Office |
| `docs/canon/DESTINY.md` | Enduring purpose | Canon | Canonical | Constitutional Office |
| `docs/constitution/KORELUMINA_CONSTITUTION.md` | Organizational constitutional law | Constitution | Repository status must be read directly; constitutional candidate | Constitutional Office or unclear |
| `docs/architecture/00_PLATFORM_CONSTITUTION.md` | Platform architecture and engineering law | Constitution | Authoritative | Owner not explicit in body |
| `BLUEPRINT.md` | Platform map and strategic architecture | Blueprint | Governing unless explicitly superseded | Chief Systems Architect / unclear in file metadata |
| `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md` | Chief Agent | Governing Architecture | Approved | Not explicitly declared |
| `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md` | Chief Agent operation | Approved Operating Model | Approved | Not explicitly declared |
| `docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md` | Mission | Approved Operating Model | Approved | Not explicitly declared |
| `docs/chief-agent/CHIEF_AGENT_INTERFACE.md` | Chief Agent interface | Approved Operating Model / Specification | Approved | Not explicitly declared |
| `docs/architecture/KP_ARCHITECTURAL_RECONCILIATION.md` | Knowledge Platform Phase 0 | Final Reconciliation / Review | Phase 0 Closeout Review | Not explicitly declared |
| `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md` | Organizational Memory | Final Reconciliation | Complete / Frozen | Not explicitly declared |
| `docs/architecture/knowledge-governance/reconciliation/KR-004_KNOWLEDGE_ARCHITECTURE_RECONCILIATION.md` | Knowledge architecture | Reconciliation | Draft | Not explicitly declared |
| `docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md` | Knowledge | Canonical Model | Draft v1 | Not explicitly declared |
| `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md` | Knowledge | Canonical Model | Draft v1 | Not explicitly declared |
| `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md` | Knowledge | Canonical Model | Draft v1 | Not explicitly declared |
| `docs/architecture/KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V1.md` | Knowledge Operations | Specification | Status requires direct metadata review | Declared or unclear |
| `docs/architecture/KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V2.md` | Knowledge Operations | Specification | Proposed | Chief Systems Architect |
| `docs/runtime/RUNTIME_CERTIFICATION_REPORT.md` | Runtime | Certification | Certification record | Certifying authority in record or unclear |
| `docs/architecture/LUMINA_DESIGN_SYSTEM_CERTIFICATION.md` | Design System | Certification | Certification record | Certifying authority in record or unclear |
| `docs/governance/GOVERNANCE_MODEL.md` | Governance | Governance | Repository status requires direct review | Governance owner or unclear |
| `docs/governance/RECONCILIATION_PROCESS.md` | Governance | Governance | Repository status requires direct review | Governance owner or unclear |
| `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE.md` | Documentation governance | Governance / Architecture | Draft | Not explicitly declared |
| `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE_AUDIT.md` | Documentation governance | Audit | Draft audit | Not explicitly declared |
| `docs/canon/CANONICAL_DOCUMENT_HIERARCHY.md` | Repository documentation authority | Canon | Canonical / Supreme | Constitutional Office |

**UNRESOLVED** — Several documents lack explicit owner metadata, so ownership cannot be constitutionally inferred solely from directory placement.

## 8. Supersession Rules

**DOCUMENTED FACT** — Explicit `supersedes` or `superseded by` metadata is valid supersession evidence only when the replacing document itself has sufficient approval authority.

Evidence: `docs/architecture/KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V2.md` declares `supersedes` while remaining Proposed; `docs/canon/CANONICAL_DOCUMENT_HIERARCHY.md`, section **Specifications**, states proposal status does not make the predecessor non-governing.

**DOCUMENTED FACT** — Constitutional amendment may supersede constitutional provisions only through the documented amendment process.

Evidence: `docs/canon/README.md`, section **Governance**; `docs/constitution/AMENDMENT_PROCESS.md` where applicable.

**DOCUMENTED FACT** — Approved ADRs may supersede lower-level architecture or specifications when explicit.

Evidence: `docs/README.md`, section **Engineering Decision Records**; Documentation Architecture Audit.

**DOCUMENTED FACT** — Approved reconciliation may supersede roadmap assumptions, implementation claims, or prior subsystem descriptions within its reconciled scope.

Evidence: `docs/architecture/KP_ARCHITECTURAL_RECONCILIATION.md`, sections **Approved Improvements**, **Reconciled Architecture V2**, and **Final Assessment**.

**DOCUMENTED FACT** — Archive placement alone does not identify the replacement. Archived documents are evidence, not active guidance, unless an active document explicitly references or restores them.

Evidence: `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE.md`, section **Knowledge Governance Rule**.

**DOCUMENTED FACT** — Version numbers alone do not establish authority.

Evidence: repository hierarchy rules prioritize authority, approval state, scope, and explicit supersession; proposed V2 documentation does not automatically govern over an approved or active V1.

## 9. Conflict Resolution Procedure

The repository provides partial but consistent conflict-resolution evidence.

1. Confirm same scope.
   - **DOCUMENTED FACT** — Architecture and specifications are scope-bound; lower-level artifacts inherit from higher-level scope.
2. Compare authority class.
   - **DOCUMENTED FACT** — `docs/canon/README.md`, **Authority**, and `docs/README.md`, **Repository Knowledge Hierarchy**.
3. Compare approval state.
   - **DOCUMENTED FACT** — Drafts, proposals, research, and audits are non-final; approved, active, frozen, authoritative, and canonical documents govern within scope.
4. Check explicit supersession.
   - **DOCUMENTED FACT** — ADR, amendment, reconciliation, and replacement metadata are recognized mechanisms.
5. Check ownership.
   - **DOCUMENTED FACT** — Major documents should identify authority and owner; package and capability ownership is mandatory in `docs/architecture/00_PLATFORM_CONSTITUTION.md`.
6. Check delegated authority.
   - **INFERENCE** — Narrower approved documents govern only where higher-level authority delegates their scope and no contradiction exists.
7. Treat chronology as non-decisive.
   - **DOCUMENTED FACT** — Authority hierarchy, not recency, governs.
8. If equal or ambiguous, mark unresolved.
   - **DOCUMENTED FACT** — Documentation Architecture identifies multiple constitutional documents as requiring reconciliation.
9. Constitutional conflict requires constitutional reconciliation or amendment.
   - **DOCUMENTED FACT** — `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE.md`, section **Constitutional Reconciliation Required**.
10. Architectural conflict requires approved ADR or architecture reconciliation.
   - **INFERENCE** — Supported by ADR authority and reconciliation process evidence.

**UNRESOLVED** — The repository does not contain one universally approved conflict-resolution procedure covering every document class and ownership dispute.

## 10. Normative Language

**DOCUMENTED FACT** — Governing repository documents regularly use `must`, `shall`, `required`, `should`, `may`, and `recommended` in their ordinary standards sense.

Observed usage:

- `MUST` / `SHALL`: mandatory requirement or prohibition. Examples: `docs/architecture/00_PLATFORM_CONSTITUTION.md`, **Core Laws**, **Merge Gate**, and **Production Completion Rule**.
- `REQUIRED`: mandatory precondition or field. Examples: Chief Agent approval gates and Knowledge IR validation requirements.
- `SHOULD`: expected guidance that permits justified exceptions. Examples: Knowledge IR normalizer and validator responsibilities.
- `MAY`: permission or allowed behavior, not obligation. Examples: Chief Agent decision boundaries.
- `RECOMMENDED`: preferred practice or classification, not mandatory unless incorporated by a higher governing rule.

**UNRESOLVED** — No repository-wide normative-language standard equivalent to RFC 2119/8174 was found that formally defines capitalization, binding force, or exception handling for every document.

## 11. Architectural Invariants

### Human governance remains authoritative

Evidence: `docs/canon/VISION_2050.md`, section **Human Leadership**; `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md`, sections **Decision Boundaries** and **Human Override**.

**DOCUMENTED FACT** — AI advises, analyzes, recommends, summarizes, coordinates, and operates within approval gates; humans govern, approve, prioritize, define direction, and retain responsibility.

### Runtime truth must not be fabricated

Evidence: `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md`, section **Relationship to Runtime**.

**DOCUMENTED FACT** — Chief Agent decisions must be grounded in runtime truth, and Builder does not invent runtime state.

### Knowledge is permanent engineering evidence

Evidence: `docs/architecture/00_PLATFORM_CONSTITUTION.md`, Laws 6, 7, 9, 11, and 12.

**DOCUMENTED FACT** — Engineering evidence must become reusable knowledge, and historical work must be recovered rather than discarded.

### Evidence remains traceable and distinct from knowledge

Evidence: `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md`, sections **Purpose**, **Core Rule**, **Provenance Rule**, and **Evidence to Knowledge Flow**.

**DOCUMENTED FACT** — Evidence is immutable source material; derived knowledge may evolve but must retain provenance.

### Canonical promotion requires governance

Evidence: `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md`, sections **Review Rule** and **Validation Responsibilities**; `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`, **Human Approval Gates**.

**DOCUMENTED FACT** — Conversation-derived decisions, principles, and lessons require human review, and canonical knowledge promotion is a human approval gate.

### Organizational Memory does not own execution or learning state

Evidence: `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md`, sections **Architecture** and **Responsibilities**.

**DOCUMENTED FACT** — Organizational Memory consumes generalized learning outputs, preserves institutional knowledge, excludes customer IP, and does not own Learning, Reasoning, Planning, Execution, Agent state, or governance approval.

### Learning precedes autonomy

Evidence: `docs/architecture/knowledge-governance/reconciliation/KR-004_KNOWLEDGE_ARCHITECTURE_RECONCILIATION.md`, quoted Engineering Intelligence Platform principles; `docs/architecture/00_PLATFORM_CONSTITUTION.md`, Law 8.

**DOCUMENTED FACT** — Knowledge precedes reasoning, context precedes planning, learning precedes autonomy, and agent maturity must be demonstrated through evidence.

## 12. Constitutional Register

| Document | Authority Class | Approval State | Owner | Scope | Decision Authority | Supersedes | Superseded By | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/canon/README.md` | Canon | Canonical / Supreme | Constitutional Office | Repository identity and authority | Highest repository authority beneath humans | None stated | None stated | **Authority**, **Governance** |
| `docs/canon/VISION_2050.md` | Canon | Canonical / Supreme | Constitutional Office | Vision 2050 | Long-term direction | None stated | None stated | Metadata, **Purpose**, **Vision Statement** |
| `docs/canon/FOUNDING_CHARTER.md` | Canon | Canonical | Constitutional Office | Founding purpose | Organizational purpose | None stated | None stated | Canon registry |
| `docs/canon/DESTINY.md` | Canon | Canonical | Constitutional Office | Enduring purpose | Strategic identity | None stated | None stated | Canon registry |
| `docs/canon/CANONICAL_DOCUMENT_HIERARCHY.md` | Canon | Canonical / Supreme | Constitutional Office | Documentation authority | Document precedence and conflict classification | None stated | None stated | Metadata, **Canonical precedence** |
| `docs/constitution/KORELUMINA_CONSTITUTION.md` | Constitution | UNRESOLVED from current evidence | Constitutional Office or unclear | Organization | Constitutional law | UNRESOLVED | UNRESOLVED | Path and constitutional domain |
| `docs/architecture/00_PLATFORM_CONSTITUTION.md` | Constitution | Authoritative | Owner not explicit | Platform | Platform laws and mandatory engineering rules | None stated | None stated | **Status**, **Core Laws** |
| `BLUEPRINT.md` | Blueprint | Governing / status requires direct review | Chief Systems Architect or unclear | Platform | Whole-platform architecture | UNRESOLVED | UNRESOLVED | `docs/README.md`, **Blueprint** |
| `docs/architecture/CHIEF_AGENT_ARCHITECTURE.md` | Governing Architecture | Approved | Unclear | Chief Agent | Chief Agent role and boundaries | None stated | None stated | **Status**, **Purpose** |
| `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md` | Approved Operating Model | Approved | Unclear | Chief Agent | Operating loop and approval gates | None stated | None stated | **Status**, **Human Approval Gates** |
| `docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md` | Approved Operating Model | Approved | Unclear | Mission | Mission lifecycle and ownership | None stated | None stated | **Status**, **Mission Lifecycle** |
| `docs/chief-agent/CHIEF_AGENT_INTERFACE.md` | Approved Operating Model / Specification | Approved | Unclear | Chief Agent | Interface responsibilities | None stated | None stated | **Status**, **Purpose** |
| `docs/architecture/KP_ARCHITECTURAL_RECONCILIATION.md` | Final Reconciliation / Review | Phase 0 Closeout Review | Unclear | Knowledge Platform | Reconciled Phase 0 state | Original KP roadmap assumptions within scope | Later approved reconciliation if any | **Purpose**, **Reconciled Architecture V2** |
| `docs/architecture/reconciliation/KP-014_ORGANIZATIONAL_MEMORY_RECONCILIATION.md` | Final Reconciliation | Complete / Frozen | Unclear | Organizational Memory | Frozen subsystem boundaries | Prior Organizational Memory implementation descriptions within scope | None stated | **Status**, **Architecture Freeze** |
| `docs/architecture/knowledge-governance/reconciliation/KR-004_KNOWLEDGE_ARCHITECTURE_RECONCILIATION.md` | Reconciliation | Draft | Unclear | Knowledge | No final decision authority | None | None | **Status** |
| `docs/architecture/CANONICAL_KNOWLEDGE_MODEL.md` | Canonical Model | Draft v1 | Unclear | Knowledge | Non-final model guidance | None | None | **Status**, **Purpose** |
| `docs/architecture/knowledge-governance/KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md` | Canonical Model | Draft v1 | Unclear | Knowledge | Non-final IR contract | None | None | **Status**, **Core Rule** |
| `docs/architecture/knowledge-governance/EVIDENCE_MODEL.md` | Canonical Model | Draft v1 | Unclear | Knowledge | Non-final evidence contract | None | None | **Status**, **Core Rule** |
| `docs/architecture/KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V2.md` | Specification | Proposed | Chief Systems Architect | Knowledge Operations | Non-governing proposal | Claims V1 | None | Metadata |
| `docs/runtime/RUNTIME_CERTIFICATION_REPORT.md` | Certification | Certification record | Certification authority unclear | Runtime | Validated status only | Prior certification if explicit | Later certification | Certification report |
| `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE.md` | Governance / Architecture | Draft | Unclear | Documentation | Non-final classification guidance | None | None | **Status**, **Document Authority Order** |
| `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE_AUDIT.md` | Audit | Draft audit | Unclear | Documentation | Findings only | None | None | **Status**, **Immediate Governance Decisions** |

## 13. Repository Governance Gaps

**DOCUMENTED GAP** — Multiple constitutional documents have overlapping scope and no completed constitutional reconciliation.

Evidence: `docs/architecture/knowledge-governance/DOCUMENTATION_ARCHITECTURE.md`, section **Constitutional Reconciliation Required**.

**DOCUMENTED GAP** — Several approved or frozen documents lack explicit owner metadata.

Evidence: Chief Agent architecture, Chief Agent operating documents, KP reconciliation documents, and Organizational Memory reconciliation bodies.

**DOCUMENTED GAP** — The repository has no single universally approved document-status transition model.

Evidence: Documentation Architecture Audit proposes status values but remains draft.

**DOCUMENTED GAP** — ADR and EDR authority are described, but a single reconciled registry with approval and supersession metadata is not established by the reviewed evidence.

**DOCUMENTED GAP** — Certification authority is record-specific and not defined as a single constitutional office.

**DOCUMENTED GAP** — Documentation Stewardship responsibilities are described, but approval rights and authority boundaries are not constitutionally formalized.

**DOCUMENTED GAP** — Draft knowledge models coexist with code and reconciliations claiming frozen or production-ready status.

Evidence: Draft CKM, Knowledge IR, and Evidence Model versus frozen Organizational Memory reconciliation and implemented KPP pipeline.

**DOCUMENTED GAP** — Proposed Knowledge Operations V2 declares supersession despite remaining Proposed.

**DOCUMENTED GAP** — Reconciliation identifiers are duplicated across different capability names.

Evidence: multiple `KP-014` reconciliation paths.

**DOCUMENTED GAP** — Normative language is used extensively without a repository-wide formal definition standard.

## 14. Unresolved Constitutional Questions

1. Which constitutional artifact governs when `docs/constitution/KORELUMINA_CONSTITUTION.md`, `docs/architecture/00_PLATFORM_CONSTITUTION.md`, and any governance-level constitution overlap?
2. Which office has final approval authority for constitutional reconciliation?
3. Is `BLUEPRINT.md` formally approved, and which owner is constitutionally accountable for it?
4. Are approved ADRs and approved EDRs distinct authority classes or two names for the same decision mechanism?
5. What exact status transition makes a draft canonical model governing?
6. Does `Complete` establish authority without explicit approval and ownership metadata?
7. Which reconciliation documents are final when their status says review but their body contains closeout conclusions?
8. What repository-wide authority determines that a specification has been superseded when successor metadata is proposed but unapproved?
9. Who is the constitutional Certification Authority?
10. Who owns Documentation Stewardship, and what approval rights accompany that role?
11. Does the repository require RFC 2119/8174 semantics for normative language, or another formal standard?
12. Which document resolves Chief Agent versus Engineer Agent terminology at constitutional scope?
13. Which authority governs canonical promotion when documentation requires human approval but implementation performs automatic promotion after validation?

