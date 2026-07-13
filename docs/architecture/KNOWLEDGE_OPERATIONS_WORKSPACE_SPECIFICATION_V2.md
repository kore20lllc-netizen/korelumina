Create the governing Knowledge Operations V2 UI contract as a full file.

cat > docs/architecture/KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V2.md <<'EOF'
---
title: Knowledge Operations Workspace Specification V2
status: Proposed
owner: Chief Systems Architect
authority: Architecture
version: 2.0.0
review_cycle: Quarterly
supersedes:
  - KNOWLEDGE_OPERATIONS_WORKSPACE_SPECIFICATION_V1.md
related:
  - ../../BLUEPRINT.md
  - ../../GOVERNANCE.md
  - ../master-os/KNOWLEDGE_NATIVE_ARCHITECTURE.md
  - ../architecture/CHIEF_AGENT_ARCHITECTURE.md
  - ../chief-agent/CHIEF_AGENT_INTERFACE.md
  - ../constitution/KORELUMINA_CONSTITUTION.md
---
# Knowledge Operations Workspace Specification V2
## 1. Purpose
Knowledge Operations is the executive operating console for the KoreLumina knowledge ecosystem.
It governs the complete knowledge lifecycle:
```text
Acquire
  ↓
Extract
  ↓
Normalize
  ↓
Knowledge IR
  ↓
Validate
  ↓
Canonical Review
  ↓
Publish
  ↓
Organizational Memory
  ↓
Chief Agent

Knowledge Operations is not a compiler dashboard, document browser, or isolated graph viewer.

It is the operational surface through which engineers observe, govern, validate, preserve, and certify organizational knowledge.

⸻

2. Governing Principles

2.1 UI Is the Contract

The approved interface defines the operational contract of the subsystem.

Backend implementation must satisfy the UI contract.

The UI must not be reduced to a passive representation of backend implementation details.

2.2 Runtime Operations Is the Reference Workspace

Runtime Operations is the canonical reference for all Master OS workspaces.

Knowledge Operations must inherit its:

* workspace shell
* hero composition
* visual hierarchy
* metric-card structure
* toolbar behavior
* inspector pattern
* responsive behavior
* activity presentation
* surface elevation
* spacing rhythm
* typography
* motion language
* loading behavior
* empty-state behavior
* error-state behavior

Knowledge Operations may introduce domain-specific information, but it must not introduce a separate interaction model or visual language.

2.3 Lumina Design System Is Mandatory

Knowledge Operations must exclusively use the Lumina Design System.

Approved primitives include:

* LuminaWorkspace
* LuminaWorkspaceHero
* LuminaWorkspaceHeader
* LuminaWorkspaceToolbar
* LuminaSurface
* LuminaPanelHeader
* LuminaMetricCard
* LuminaMetricGrid
* LuminaInspectorSection
* LuminaButton
* LuminaBadge
* shared Lumina tokens
* shared Lumina appearance variables
* shared Lumina typography
* shared Lumina spacing and radius tokens

Custom glass surfaces, arbitrary colors, independent shadows, and subsystem-specific design primitives are prohibited.

2.4 Executive First

The first viewport must answer:

* What changed?
* What knowledge entered?
* What is healthy?
* What is blocked?
* What requires approval?
* What contradictions exist?
* What should happen next?
* Is the Chief Agent ready to consume the current knowledge state?

2.5 Knowledge Is Operational

Knowledge is not presented as a collection of documents.

It is presented as:

* evidence
* decisions
* relationships
* operational guidance
* lessons
* recovery knowledge
* canonical truth
* organizational capability

2.6 Runtime and Repository Truth

Knowledge Operations must never fabricate:

* source status
* ingestion state
* evidence
* confidence
* promotion state
* canonical state
* certification state
* conversation provenance

All displayed state must originate from authoritative platform services.

⸻

3. Workspace Identity

3.1 Brand

The workspace must use the standard KoreLumina brand component.

Hero hierarchy:

KoreLumina
Knowledge Operations
Acquire • Preserve • Learn • Govern

3.2 Visual Palette

Knowledge Operations inherits the Runtime Operations palette.

Semantic usage:

* Cyan: live operations, active acquisition, current state
* Violet: knowledge graph, memory, relationships
* Magenta: canonical knowledge, promoted intelligence
* Gold: reasoning, executive recommendations, approvals
* Emerald: healthy, validated, certified
* Amber: pending review, degraded confidence
* Rose: contradiction, rejected knowledge, critical failure

No new workspace palette may be introduced.

3.3 Surface Behavior

All surfaces must use the active Lumina appearance contract.

Required properties:

* token-driven background
* token-driven border
* token-driven blur
* token-driven shadow
* token-driven radius
* token-driven interactive state

No Tailwind class names may be stored as CSS property values.

⸻

4. Workspace Navigation

Knowledge Operations must expose the following primary views:

Overview
Acquisition
Evidence
Knowledge Graph
Canonical Review
Learning
Conversations
Certifications
Governance

Navigation must remain visible and understandable on desktop.

On constrained layouts, navigation may collapse into a Lumina-compatible segmented control, menu, or sheet without changing the information architecture.

⸻

5. Overview Workspace

The Overview is the executive landing surface.

It must provide an operational briefing rather than implementation diagnostics.

5.1 Hero Metrics

The hero must surface:

* Knowledge Health
* Active Sources
* Pending Reviews
* Contradictions
* Conversation Backlog
* Chief Agent Readiness
* Last Updated

The metric hierarchy must match Runtime Operations.

5.2 Executive Brief

The Executive Brief must answer:

* What entered the knowledge system?
* What was validated?
* What was promoted?
* What failed?
* What is blocked?
* What requires human approval?
* What should happen next?

5.3 Knowledge Health Overview

Required health domains:

* Acquisition
* Evidence
* Normalization
* Validation
* Publication
* Canonical Knowledge
* Organizational Memory
* Chief Agent Readiness

5.4 Recent Activity

The activity feed must display traceable operational events such as:

* repository evidence acquired
* runtime evidence recorded
* conversation archive imported
* extraction completed
* contradiction detected
* candidate promoted
* canonical knowledge superseded
* certification published
* acquisition job failed
* approval requested

Each event must link to its source, resulting artifact, or related operation.

5.5 Recommended Actions

The Overview must surface prioritized recommendations.

Examples:

* review high-confidence promotion
* resolve contradiction
* import pending conversation archive
* retry failed acquisition
* validate unverified evidence
* certify knowledge pipeline
* inspect Chief Agent readiness blocker

⸻

6. Acquisition Workspace

Acquisition manages all knowledge sources.

6.1 Supported Sources

Required source categories:

* Git repositories
* Runtime events
* Architecture documentation
* Specifications
* Engineering decisions
* Conversation archives
* Certifications
* Incident reports
* Recovery records
* Manual knowledge
* External research

6.2 Source Card Contract

Each source must display:

* name
* type
* health
* connection state
* last successful sync
* next scheduled sync
* acquired item count
* failed item count
* coverage
* confidence
* owning project
* provenance availability

6.3 Acquisition Actions

Supported actions:

* connect source
* disconnect source
* start acquisition
* retry failed acquisition
* pause acquisition
* inspect evidence
* review source configuration
* open source history

Destructive source changes require human confirmation.

6.4 Acquisition State Model

Every source must support:

* disconnected
* connecting
* healthy
* syncing
* degraded
* failed
* paused
* unauthorized

⸻

7. Evidence Workspace

Evidence is the observable processing pipeline.

7.1 Pipeline

Raw Evidence
  ↓
Extracted Evidence
  ↓
Normalized Evidence
  ↓
Knowledge IR
  ↓
Validated Candidate
  ↓
Published Knowledge

7.2 Stage Contract

Each stage must display:

* item count
* throughput
* failure count
* average processing time
* oldest queued item
* confidence distribution
* source distribution
* blocked items
* retry state

7.3 Evidence Inspector

Selecting an evidence item opens the Knowledge Inspector.

The inspector must show:

* source
* source URI
* source type
* project
* repository
* conversation
* message
* timestamp
* author
* extracted content
* normalized content
* relationships
* confidence
* validation findings
* promotion status
* supersession status

Raw source provenance must remain available.

7.4 Evidence Actions

Supported actions:

* inspect
* retry
* reject
* mark duplicate
* link relationship
* request validation
* submit for canonical review

⸻

8. Knowledge Graph Workspace

The Knowledge Graph is an operational relationship surface.

It must not be an empty decorative visualization.

8.1 Node Types

Required node categories:

* projects
* repositories
* architecture components
* runtime services
* missions
* agents
* conversations
* evidence
* decisions
* specifications
* patterns
* lessons
* incidents
* recovery anchors
* certifications
* canonical knowledge

8.2 Relationship Types

Required relationships include:

* belongs to
* produced by
* derived from
* validates
* contradicts
* supersedes
* affects
* depends on
* recovered by
* certified by
* consumed by
* related to

8.3 Graph Interaction

Users must be able to:

* search nodes
* filter node types
* filter relationship types
* focus a subgraph
* inspect provenance
* open related artifacts
* view contradiction paths
* view supersession chains
* trace knowledge to source evidence

8.4 Graph States

Required states:

* loading
* ready
* filtered
* empty
* degraded
* unavailable
* permission denied

⸻

9. Canonical Review Workspace

Canonical Review is the human-governed promotion center.

9.1 Review Queue

Each candidate must display:

* title
* proposed category
* confidence
* source count
* evidence quality
* contradictions
* duplicate risk
* superseded knowledge
* affected capabilities
* affected architecture
* recommendation
* approval requirement

9.2 Review Decision

Available decisions:

* approve
* reject
* request more evidence
* merge with existing knowledge
* mark duplicate
* mark superseded
* defer
* escalate

9.3 Approval Detail

Every approval must include:

* supporting evidence
* rationale
* assumptions
* risks
* expected outcome
* architectural impact
* capability impact
* rollback or reversal strategy
* approver
* timestamp

9.4 Governance Rule

Canonical promotion always requires human approval.

No Chief Agent, specialist agent, or automated job may bypass this gate.

⸻

10. Learning Workspace

Learning exposes validated organizational improvement.

10.1 Learning Categories

* engineering patterns
* recurring failures
* successful recoveries
* architectural evolution
* implementation lessons
* governance lessons
* operational improvements
* capability maturity changes
* reusable playbooks
* common pitfalls

10.2 Learning Views

Required views:

* Today
* This Week
* By Project
* By Capability
* By Mission
* By Failure Type
* By Recovery Pattern

10.3 Learning Inspector

Each learning item must include:

* lesson
* supporting evidence
* related decisions
* related missions
* related failures
* confidence
* reuse guidance
* canonical status
* Chief Agent availability

⸻

11. Conversations Workspace

Conversations are a primary historical acquisition source.

This workspace exists to ingest and preserve the complete engineering history from Exodus through the current KoreLumina platform.

11.1 Conversation Pipeline

Conversation Archive
  ↓
Archive Parser
  ↓
Conversation Normalization
  ↓
Evidence Extraction
  ↓
Decision Extraction
  ↓
Failure Extraction
  ↓
Recovery Extraction
  ↓
Architecture Extraction
  ↓
Knowledge IR
  ↓
Validation
  ↓
Canonical Review

11.2 Supported Conversation Sources

* ChatGPT data export
* individually exported transcripts
* Markdown transcripts
* JSON conversation archives
* repository-preserved conversation records
* manually imported historical sessions

11.3 Conversation Record

Each imported conversation must preserve:

* conversation identifier
* title
* created timestamp
* updated timestamp
* participants
* source archive
* source URI or path
* project association
* message count
* import status
* extraction status
* validation status
* provenance completeness

11.4 Message Provenance

Every extracted item must remain traceable to:

Archive
  ↓
Conversation
  ↓
Message
  ↓
Author
  ↓
Timestamp
  ↓
Evidence
  ↓
Knowledge Candidate

11.5 Extracted Knowledge Types

Conversation ingestion must support extraction of:

* architectural decisions
* requirements
* implementation decisions
* rejected approaches
* failures
* root causes
* corrections
* recovery procedures
* recovery anchors
* production rules
* user approvals
* engineering lessons
* milestones
* commit references
* tags
* unresolved risks
* canonical knowledge candidates

11.6 Contradiction Handling

Historical conversations may contain obsolete or incorrect conclusions.

The system must:

* preserve the original evidence
* identify later corrections
* establish chronology
* mark superseded conclusions
* avoid direct canonical promotion
* require validation before Chief Agent consumption

11.7 Conversation States

Required states:

* awaiting import
* importing
* parsed
* extracting
* validating
* ready for review
* partially failed
* failed
* archived

⸻

12. Certifications Workspace

Certifications are first-class knowledge artifacts.

12.1 Certification Categories

* Runtime Operations
* Knowledge Operations
* Chief Agent
* Builder
* Deployment
* Security
* Repository Intelligence
* Agent Platform

12.2 Certification Record

Each certification must display:

* subsystem
* certification status
* version
* branch
* commit
* tag
* certification date
* evidence location
* passed checks
* warnings
* failed checks
* risk assessment
* certifying authority

12.3 Certification States

* pending
* running
* certified
* certified with warnings
* failed
* expired
* superseded

⸻

13. Governance Workspace

Governance manages policy, authority, and auditability.

13.1 Governance Domains

* canonical promotion
* retention
* source access
* privacy
* approval authority
* contradiction resolution
* supersession
* certification policy
* Chief Agent consumption policy
* historical archive handling

13.2 Audit Trail

The workspace must expose:

* action
* actor
* authority
* affected artifact
* prior state
* new state
* rationale
* timestamp
* evidence
* approval reference

⸻

14. Knowledge Inspector

The Inspector must follow the Runtime Operations inspector pattern.

It is contextual and selection-driven.

14.1 Inspector Tabs

Depending on selected artifact:

* Overview
* Provenance
* Relationships
* Validation
* History
* Governance

14.2 Inspector Rules

The inspector must not duplicate:

* main workspace tables
* full activity feeds
* full graph visualization
* entire evidence pipeline

It must provide focused operational detail for the selected item.

⸻

15. Toolbar Contract

The workspace toolbar follows Runtime Operations.

15.1 Leading Content

Displays:

* selected artifact
* active filter
* current pipeline stage
* selection count

15.2 Trailing Actions

Context-dependent actions may include:

* import
* acquire
* retry
* validate
* submit for review
* approve
* reject
* open inspector
* refresh

Unsupported actions must not be displayed as permanently disabled placeholders.

⸻

16. State Contract

Every workspace must implement the following states.

16.1 Loading

* Lumina skeletons
* preserved layout
* no layout shift
* clear operation label

16.2 Empty

* explain why data is absent
* offer the next valid action
* avoid generic empty illustrations

16.3 Error

* display actionable error
* include retry
* preserve known-good data when possible
* include evidence or diagnostic identifier

16.4 Degraded

* identify affected service
* identify stale data
* show last successful update
* preserve unaffected capabilities

16.5 Unauthorized

* explain required capability
* do not expose restricted data
* provide no misleading controls

16.6 Offline

* identify unavailable service
* preserve cached state if approved
* clearly mark non-live information

⸻

17. Responsive Contract

17.1 Desktop

Desktop must preserve:

* hero
* primary navigation
* main operational canvas
* contextual inspector
* workspace toolbar

17.2 Tablet

Tablet may:

* collapse the inspector into a sheet
* condense metric cards
* move secondary navigation into a scrollable control

17.3 Mobile

Mobile must:

* preserve executive metrics
* preserve primary actions
* use sheets for inspector and filters
* avoid horizontal workspace overflow
* avoid hiding critical approval or failure state

Responsive behavior must match Runtime Operations patterns.

⸻

18. Access Control

Knowledge Operations requires explicit capabilities.

Recommended capability boundaries:

* knowledge view
* knowledge acquisition
* evidence review
* canonical review
* knowledge governance
* conversation import
* certification management

Access must not rely solely on adminTools.

Capabilities must be domain-specific and auditable.

⸻

19. Service Contract

The UI contract expects authoritative services for:

* overview snapshot
* source registry
* acquisition jobs
* evidence pipeline
* knowledge graph
* canonical review
* learning
* conversation ingestion
* certifications
* governance events

19.1 Snapshot Requirements

Every snapshot must include:

* updatedAt
* health
* source state
* pipeline state
* pending work
* failure state
* readiness state

19.2 Event Requirements

Knowledge Operations must support live events for:

* source state change
* acquisition started
* acquisition completed
* acquisition failed
* evidence extracted
* evidence normalized
* validation completed
* contradiction detected
* promotion requested
* promotion approved
* promotion rejected
* canonical knowledge published
* conversation imported
* certification completed

⸻

20. Runtime Operations Parity Matrix

Runtime Operations	Knowledge Operations
Runtime Health	Knowledge Health
Active Services	Active Sources
Runtime Metrics	Knowledge Metrics
Runtime Events	Knowledge Events
Runtime Timeline	Knowledge Timeline
Runtime Inspector	Knowledge Inspector
Runtime Lifecycle	Knowledge Pipeline Lifecycle
Runtime Scenarios	Acquisition and Validation Operations
Runtime Certification	Knowledge Certification
Service Selection	Knowledge Artifact Selection
Runtime Toolbar	Knowledge Operations Toolbar

Runtime Operations remains the implementation reference.

⸻

21. Lumina Compliance Matrix

UI Area	Required Lumina Primitive
Workspace shell	LuminaWorkspace
Hero	LuminaWorkspaceHero
Header	LuminaWorkspaceHeader
Toolbar	LuminaWorkspaceToolbar
Executive metrics	LuminaMetricCard, LuminaMetricGrid
Panels	LuminaSurface
Panel heading	LuminaPanelHeader
Inspector sections	LuminaInspectorSection
Commands	LuminaButton
Status	LuminaBadge
Appearance	Lumina appearance tokens

Any deviation requires architecture review.

⸻

22. Chief Agent Readiness Contract

Knowledge Operations is ready for Chief Agent consumption only when:

* source health is known
* evidence provenance is complete
* validation is operational
* contradiction detection is operational
* canonical promotion is governed
* organizational memory is available
* conversation history is ingested or explicitly tracked as backlog
* certification is current

The workspace must show Chief Agent readiness as an explicit operational state.

Possible states:

* ready
* partially ready
* blocked
* degraded
* uncertified

⸻

23. Certification Requirements

Knowledge Operations is not production-ready until all requirements pass.

23.1 UI Certification

* Runtime Operations visual parity
* Lumina Design System compliance
* responsive layouts
* loading states
* empty states
* degraded states
* error states
* permission states
* inspector behavior
* no duplicated operational surfaces

23.2 Functional Certification

* acquisition sources
* evidence lifecycle
* normalization
* validation
* publication
* canonical review
* contradiction handling
* conversation ingestion
* provenance
* certification records
* live events

23.3 Governance Certification

* human approval enforcement
* canonical promotion enforcement
* audit trail
* access control
* supersession history
* rejection history

23.4 Build Certification

* runtime build
* builder build
* contract validation
* route validation
* clean shutdown
* reproducible certification harness

23.5 Required Artifacts

scripts/certify-knowledge-operations.sh
docs/knowledge/KNOWLEDGE_OPERATIONS_CERTIFICATION_REPORT.md
docs/certification/knowledge/

23.6 Release Gate

Knowledge Operations must be:

* implemented
* validated
* certified
* documented
* merged to main
* tagged with a certification tag

before Chief Agent implementation begins.

⸻

24. Implementation Order

Implementation must proceed one green ticket at a time:

1. Workspace shell and navigation
2. Overview
3. Acquisition
4. Evidence
5. Knowledge Graph
6. Canonical Review
7. Learning
8. Conversations
9. Certifications
10. Governance
11. Live events
12. Access control
13. Certification harness

Each ticket must:

* preserve Runtime Operations parity
* use Lumina primitives
* pass Runtime and Builder builds
* avoid unrelated changes
* remain traceable to this specification

⸻

25. Approval Gate

This specification becomes authoritative only after human approval.

Until approved:

* no Knowledge Operations V2 implementation begins
* no backend contract is redesigned
* no Chief Agent integration begins
* no new workspace interaction model is introduced

Once approved, this document supersedes V1 as the governing Knowledge Operations workspace contract.

