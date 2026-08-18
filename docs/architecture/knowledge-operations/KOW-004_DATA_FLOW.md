# KOW-004 — Knowledge Operations Data Flow Contract

Status: Proposed for approval
Depends on:
- KOW-001
- KOW-002
- KOW-003

Operational authority:
- Knowledge Preservation Platform
- Knowledge Operations services
- Governance contracts
- Chief Agent knowledge-consumption policy

---

# 1. Purpose

This document defines how authoritative knowledge moves through KoreLumina
and how the Knowledge Operations workspace consumes that state.

The contract covers:

- Source acquisition
- Evidence creation
- Knowledge IR compilation
- Canonical promotion
- Knowledge graph construction
- Organizational learning
- Reasoning
- Governance
- Automation
- Chief Agent synchronization
- UI orchestration
- Refresh behavior
- Failure handling
- Event propagation

The UI must not invent, infer, or fabricate operational data that is not
returned by an authoritative service.

---

# 2. Authoritative Flow

The canonical knowledge lifecycle is:

Source

↓

Acquisition

↓

Evidence

↓

Knowledge IR

↓

Canonical Review

↓

Canonical Memory

↓

Knowledge Graph

↓

Learning

↓

Reasoning

↓

Governance

↓

Automation

↓

Chief Agent Synchronization

Each stage has a distinct owner and must not be collapsed into another
stage for UI convenience.

---

# 3. Authoritative Sources

Supported source categories include:

- Git repositories
- Pull requests
- Issues
- Commit history
- Runtime telemetry
- Runtime certification evidence
- Architecture documents
- Product specifications
- Engineering conversations
- Decision records
- Deployment evidence
- Operational incidents
- Approved external providers

Each source must expose:

- Source identity
- Source type
- Provider
- Trust level
- Project association
- Registration state
- Last acquisition time
- Last successful acquisition
- Failure state
- Governance status

Unregistered or unapproved sources must not contribute to canonical
knowledge.

---

# 4. Acquisition Flow

Acquisition begins when:

- A source is registered
- An operator requests acquisition
- A scheduled acquisition runs
- A certified event triggers acquisition
- A provider emits an approved change event

Acquisition produces:

- Evidence candidates
- Source metadata
- Acquisition diagnostics
- Rejected items
- Failure records
- Freshness timestamps

Acquisition does not produce canonical knowledge.

Required flow:

Source Registry

↓

Acquisition Request

↓

Provider Adapter

↓

Evidence Extraction

↓

Validation

↓

Evidence Store

↓

Knowledge IR Compiler Queue

The UI must distinguish:

- Queued
- Acquiring
- Validating
- Completed
- Partially completed
- Failed
- Cancelled
- Disabled

---

# 5. Evidence Flow

Evidence is immutable source-backed material used to support knowledge.

Evidence must preserve:

- Source
- Source version
- Timestamp
- Project
- Author or actor
- Content hash
- Acquisition run
- Trust level
- Validation state
- Relationships
- Rejection reason when rejected

Evidence states:

- Discovered
- Validating
- Accepted
- Rejected
- Superseded
- Expired
- Quarantined

Evidence may be referenced by multiple Knowledge IR items.

Evidence must not be rewritten to match a desired conclusion.

---

# 6. Knowledge IR Flow

Knowledge IR is the structured intermediate representation compiled from
accepted evidence.

Required flow:

Accepted Evidence

↓

Compiler Registry

↓

Domain Compiler

↓

Knowledge IR Candidate

↓

Validation

↓

Review Eligibility

Knowledge IR must preserve:

- Compiler identity
- Compiler version
- Input evidence identifiers
- Extracted claims
- Confidence
- Contradictions
- Domain
- Project
- Relationships
- Compilation timestamp

Knowledge IR states:

- Queued
- Compiling
- Compiled
- Invalid
- Requires evidence
- Requires review
- Superseded

Knowledge IR is not canonical memory.

---

# 7. Canonical Review Flow

Canonical promotion requires a governed decision.

Required flow:

Knowledge IR Candidate

↓

Evidence Lineage Inspection

↓

Conflict Detection

↓

Governance Policy Evaluation

↓

Human or Certified Policy Decision

↓

Canonical Promotion or Rejection

Promotion outcomes:

- Approved
- Rejected
- Deferred
- Requires evidence
- Conflicted
- Supersedes existing knowledge

Every promotion decision must record:

- Decision actor
- Decision timestamp
- Evidence reviewed
- Policy applied
- Reason
- Previous canonical version
- New canonical version
- Chief Agent availability

---

# 8. Canonical Memory Flow

Canonical Memory contains trusted organizational knowledge.

Canonical entries must expose:

- Stable identity
- Version
- State
- Confidence
- Domain
- Project
- Evidence lineage
- Promotion decision
- Superseded versions
- Relationships
- Chief Agent access policy
- Publication timestamp

Canonical states:

- Published
- Restricted
- Superseded
- Conflicted
- Archived
- Revoked

Canonical Memory is the only source of trusted organizational knowledge for
the Chief Agent unless a separate certified policy explicitly authorizes
another source.

---

# 9. Knowledge Graph Flow

The Knowledge Graph is derived from authoritative evidence, Knowledge IR,
and Canonical Memory.

Required flow:

Evidence Relationships

+

Knowledge IR Relationships

+

Canonical Relationships

↓

Graph Compiler

↓

Graph Snapshot

↓

Graph Index

↓

Graph Query Service

The graph must preserve relationship provenance.

Graph entities must expose:

- Node identity
- Node type
- Node state
- Source lineage
- Confidence
- Project
- Relationships
- Conflict state
- Freshness
- Chief Agent visibility

Graph compilation failures must not alter Canonical Memory.

The UI must display the last successful graph snapshot when a new
compilation fails, together with a degraded-state warning.

---

# 10. Learning Flow

Learning identifies repeated organizational patterns.

Required flow:

Evidence

+

Knowledge IR

+

Canonical Memory

+

Runtime Outcomes

+

Engineering Conversations

↓

Pattern Detection

↓

Corroboration

↓

Validation

↓

Learning Candidate

↓

Promotion to Canonical Review when eligible

Learning states:

- Observed
- Corroborating
- Validated
- Rejected
- Expired
- Promoted

Learning must remain distinct from canonical knowledge until promotion is
approved.

The UI must not present an observed pattern as an established fact.

---

# 11. Reasoning Flow

Reasoning operates over governed inputs.

Allowed inputs:

- Accepted evidence
- Valid Knowledge IR
- Published Canonical Memory
- Approved graph relationships
- Certified runtime evidence
- Approved operator context

Required flow:

Reasoning Request

↓

Input Resolution

↓

Policy Check

↓

Reasoning Execution

↓

Finding

↓

Confidence and Contradiction Analysis

↓

Review or Operational Consumption

Reasoning states:

- Waiting
- Resolving inputs
- Running
- Completed
- Requires review
- Blocked
- Failed
- Cancelled

Reasoning output is not canonical knowledge.

Reasoning findings may:

- Inform an operator
- Create a governance request
- Create a canonical promotion candidate
- Trigger an approved automation
- Become available to the Chief Agent under policy

---

# 12. Governance Flow

Governance controls authority-sensitive knowledge transitions.

Governance inputs include:

- Promotion candidates
- Conflicts
- Duplicate knowledge
- Stale knowledge
- Expired evidence
- Low-confidence reasoning
- Provider trust changes
- Chief Agent access requests
- Automation authorization requests

Required flow:

Governance Request

↓

Policy Resolution

↓

Reviewer Assignment

↓

Decision

↓

Audit Record

↓

Downstream State Change

Governance decisions must be idempotent and auditable.

A failed downstream update must not erase the governance decision.

---

# 13. Automation Flow

Automation may consume only permitted knowledge.

Required flow:

Approved Trigger

↓

Knowledge Dependency Resolution

↓

Governance Check

↓

Execution

↓

Outcome

↓

Audit Event

↓

Knowledge or Operational Feedback

Automation states:

- Active
- Paused
- Waiting
- Running
- Completed
- Failed
- Blocked
- Awaiting approval

Automation must expose:

- Trigger
- Knowledge dependency
- Policy
- Last execution
- Outcome
- Failure
- Retry eligibility
- Downstream systems

---

# 14. Chief Agent Synchronization Flow

The Chief Agent consumes governed organizational knowledge.

Required flow:

Published Canonical Memory

+

Permitted Graph Relationships

+

Approved Reasoning Findings

↓

Chief Agent Policy Filter

↓

Knowledge Package Compilation

↓

Synchronization

↓

Verification

↓

Active Chief Agent Knowledge Version

Synchronization must expose:

- Current package version
- Previous package version
- Knowledge included
- Knowledge withheld
- Synchronization timestamp
- Verification result
- Failure reason
- Policy restrictions

The Chief Agent must never consume:

- Rejected evidence
- Invalid Knowledge IR
- Unapproved canonical candidates
- Restricted knowledge without authorization
- Failed or unverified synchronization packages

---

# 15. Workspace Data Orchestration

KnowledgeOperationsWorkspace is the UI orchestration boundary.

It may:

- Request authoritative workspace snapshots
- Request panel-specific data
- Coordinate refreshes
- Maintain selected entity state
- Maintain inspector visibility
- Subscribe to approved operational events
- Localize partial failures

It must not:

- Compile knowledge
- Calculate canonical confidence
- Promote knowledge
- Resolve governance
- Generate fake timeline activity
- Infer Chief Agent readiness
- Mutate graph relationships locally

---

# 16. Panel Data Ownership

## KnowledgeHero

Reads:

- Knowledge overview
- Health summary
- Governance summary
- Chief Agent synchronization summary
- Last successful update

Never reads:

- Raw graph nodes
- Full governance queue
- Raw evidence payloads

## KnowledgeExecutiveHealth

Reads:

- Knowledge health service
- Coverage diagnostics
- Freshness diagnostics
- Graph integrity diagnostics
- Governance health summary

Never reads:

- UI-derived counts
- Local graph state

## KnowledgeGraphViewport

Reads:

- Graph query service
- Graph snapshot metadata
- Graph filters
- Node and relationship details

Never reads:

- Governance queue directly
- Automation execution state

## KnowledgeActivityTimeline

Reads:

- Knowledge activity service
- Audited operational events

Never creates synthetic events.

## EvidencePipelinePanel

Reads:

- Source registry
- Acquisition service
- Evidence processing status

Never reads:

- Canonical publication history

## CanonicalMemoryPanel

Reads:

- Canonical memory service
- Promotion history
- Canonical review summary

Never reads:

- Unvalidated learning as canonical knowledge

## LearningIntelligencePanel

Reads:

- Learning service
- Pattern validation state
- Promotion eligibility

Never writes directly to Canonical Memory.

## ReasoningOperationsPanel

Reads:

- Reasoning queue
- Reasoning run details
- Findings and contradictions

Never promotes findings directly.

## GovernanceQueuePanel

Reads:

- Governance service
- Policy service
- Reviewer assignments

Writes only through governed actions.

## AutomationOperationsPanel

Reads:

- Automation service
- Execution history
- Knowledge dependency state

Never bypasses governance.

## KnowledgeLineagePanel

Reads:

- Provenance service
- Evidence lineage
- Canonical version history
- Chief Agent package lineage

Never mutates lineage.

## KnowledgeInspector

Reads:

- Entity-specific detail service
- Provenance
- Relationships
- Available governed actions

The inspector must request details lazily.

---

# 17. Snapshot Contract

The workspace may use an aggregated overview snapshot for fast initial
rendering.

The snapshot must include only bounded summary data.

Recommended summary fields:

- Updated timestamp
- Overall health
- Evidence totals
- Canonical totals
- Governance totals
- Graph summary
- Acquisition summary
- Learning summary
- Reasoning summary
- Automation summary
- Chief Agent synchronization summary
- Priority alerts
- Recent bounded activity

The snapshot must not include:

- Entire graph
- Entire evidence corpus
- Entire governance queue
- Entire activity history
- Full canonical records

Large datasets require dedicated paginated or streamed APIs.

---

# 18. Refresh Contract

Refresh types:

## Initial Load

Loads:

- Overview snapshot
- Critical alerts
- Chief Agent synchronization summary

## Manual Refresh

Triggered by operator.

Must:

- Display refreshing state
- Preserve current visible data
- Avoid resetting inspector selection
- Localize failed panel refreshes

## Background Refresh

Triggered by interval or operational events.

Must:

- Avoid disruptive layout changes
- Avoid replacing newer data with older data
- Use updated timestamps or version identifiers

## Entity Refresh

Refreshes only the selected entity or affected panel.

A graph event must not force a full workspace reload unless the contract
requires it.

---

# 19. Event Contract

Approved knowledge-operation events include:

- source.registered
- source.disabled
- acquisition.started
- acquisition.completed
- acquisition.failed
- evidence.accepted
- evidence.rejected
- knowledge-ir.compiled
- knowledge-ir.failed
- canonical.review-requested
- canonical.promoted
- canonical.rejected
- canonical.superseded
- graph.compilation-started
- graph.compilation-completed
- graph.compilation-failed
- learning.observed
- learning.validated
- learning.rejected
- reasoning.started
- reasoning.completed
- reasoning.failed
- governance.requested
- governance.approved
- governance.rejected
- automation.started
- automation.completed
- automation.failed
- chief-agent.sync-started
- chief-agent.synchronized
- chief-agent.sync-failed
- certification.completed

Every event must include:

- Event identity
- Event type
- Timestamp
- Actor
- Project
- Related entity identifiers
- Outcome
- Correlation identifier

The UI must ignore unknown event types safely.

---

# 20. Concurrency Contract

The UI must protect against stale responses.

Required behavior:

- Later requests supersede earlier requests for the same resource
- Versioned snapshots prevent stale replacement
- Aborted views cancel unnecessary requests
- Duplicate refresh requests may be coalesced
- Optimistic updates are prohibited for authority-sensitive decisions
- Governance actions require authoritative confirmation

---

# 21. Cache Contract

Permitted client caching:

- Bounded overview snapshot
- Graph viewport query results
- Search result pages
- Inspector detail while active
- Static provider metadata

Prohibited client authority:

- Canonical state decisions
- Governance decisions
- Chief Agent synchronization state
- Automation execution outcome
- Evidence validation outcome

Cached data must expose:

- Version
- Updated timestamp
- Staleness state

---

# 22. Failure Contract

Failures must remain localized when possible.

Examples:

- Graph unavailable while acquisition remains healthy
- Governance unavailable while canonical memory remains readable
- Chief Agent unavailable while knowledge operations remain functional

Each failure must expose:

- Service
- Failure code
- Human-readable summary
- Last successful update
- Retry eligibility
- Correlation identifier when available

A failed service must not cause unrelated healthy data to be cleared.

---

# 23. Offline Contract

When the runtime or Knowledge Preservation Platform is unreachable:

- Existing verified data may remain visible
- Data must be marked stale or offline
- Mutating actions must be disabled
- Search must indicate limited availability
- Governance actions must not be queued silently
- Chief Agent readiness must be unavailable, not inferred
- Refresh must expose connection failure

---

# 24. Permission Contract

Data access and action access are separate.

A user may:

- View an entity but not modify it
- Review but not approve
- Inspect governance but not assign reviewers
- View Chief Agent state but not synchronize
- View sources but not register providers

The UI must consume authoritative permissions.

It must not infer authorization from role names alone.

---

# 25. Audit Contract

Every mutating action must produce an audit record.

Audited actions include:

- Source registration
- Source disablement
- Acquisition retry
- Evidence rejection
- Canonical approval
- Canonical rejection
- Knowledge supersession
- Governance assignment
- Governance decision
- Automation pause or resume
- Chief Agent synchronization
- Policy change

The UI must display confirmation only after the authoritative action
succeeds.

---

# 26. Performance Contract

Large collections must use:

- Pagination
- Cursor-based loading
- Virtualization
- Server-side filtering
- Incremental graph queries
- Bounded activity windows
- Lazy inspector details
- Debounced search

The overview snapshot must remain bounded and fast.

The graph must never be loaded in full merely to render summary metrics.

---

# 27. Security Contract

The data flow must prevent:

- Unauthorized source access
- Cross-project knowledge leakage
- Unapproved Chief Agent consumption
- Client-side authority decisions
- Untrusted provider promotion
- Hidden governance bypass
- Silent automation from ungoverned knowledge

Sensitive evidence may require redaction before UI delivery.

---

# 28. Implementation Boundary

KOW-004 defines the contract but does not authorize:

- New service endpoints without service-level design
- Local mock data
- Client-side canonical promotion
- Direct panel-to-panel service mutation
- A second event bus
- A second cache authority
- A second knowledge model

Implementation must reconcile with existing KPP services before adding new
contracts.

---

# 29. Acceptance Criteria

KOW-004 is approved when:

- Every knowledge lifecycle stage has a distinct owner.
- Evidence, Knowledge IR, Canonical Memory, Learning, and Reasoning remain
  separate.
- Panel data ownership is explicit.
- The overview snapshot is bounded.
- Refresh and event behavior are defined.
- Stale response protection is defined.
- Cache authority is limited.
- Partial failures remain localized.
- Offline behavior is defined.
- Permissions are authoritative.
- Mutating actions are audited.
- Chief Agent synchronization is governed.
- No UI component is required to invent operational state.
