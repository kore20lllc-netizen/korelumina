# KOW-006 — Knowledge Operations Production Implementation Blueprint

Status: Approved for implementation

Depends on:

- KOW-001 Executive Architecture
- KOW-002 Layout Contract
- KOW-003 Component Ownership
- KOW-004 Data Flow Contract
- KOW-005 UI State Contract
- WF-100 Executive Workspace Standard
- WF-CERT-001 Workspace Framework Certification

Reference implementation:

- Runtime Operations

Operational authority:

- Knowledge Preservation Platform
- Governance services
- Chief Agent knowledge-consumption policy

---

# 1. Purpose

KOW-006 freezes the production implementation plan for Knowledge Operations.

It does not replace KOW-001 through KOW-005.

It consolidates the certified contracts into one implementation sequence so
the workspace can be completed without additional architectural drift.

Runtime Operations remains the canonical reference for:

- LuminaWorkspaceLayout composition
- Hero structure
- Metrics placement
- Toolbar placement
- Sidebar geometry
- Main-content geometry
- Inspector geometry
- Panel materials
- Interaction behavior
- Responsive behavior

Knowledge Operations specializes that structure with knowledge-domain
content and operations.

---

# 2. Product Standard

Knowledge Operations shall be KoreLumina's flagship organizational
intelligence command center.

The finished workspace must allow an authorized operator to understand:

- Whether organizational knowledge is healthy
- What evidence has been acquired
- What knowledge is awaiting governance
- What knowledge is canonical
- What is stale, conflicting, disconnected, or unverified
- What the Chief Agent currently knows
- What the Chief Agent is prohibited from consuming
- What reasoning is running or blocked
- What automation depends on governed knowledge
- What operational action should happen next

The workspace must not behave like a static analytics dashboard.

It must be inspectable, searchable, governed, auditable, and operational.

---

# 3. Canonical Workspace Composition

Knowledge Operations shall use the same top-level composition as Runtime
Operations:

LuminaWorkspaceLayout

- header
- metrics
- toolbar
- sidebar
- content
- inspector

The workspace shall not embed metrics inside the hero.

The workspace shall not recreate outer spacing, maximum width, panel chrome,
hover behavior, elevation, motion, or background ownership.

---

# 4. Header

The header owns:

- KoreLumina brand
- Knowledge Operations identity
- Domain tagline
- Concise mission statement
- Primary actions
- Current workspace status

Primary actions:

- Back
- Refresh
- Acquire
- Providers
- Governance
- Settings

The header must not contain:

- Metric grids
- Full search results
- Long timelines
- Graph visualizations
- Operational tables

---

# 5. Metrics Architecture

All eight knowledge metrics remain available.

They are divided into two tiers.

## 5.1 Executive Metrics

Displayed first:

1. Knowledge Health
2. Evidence
3. Canonical Memory
4. Promotion Rate

These metrics answer:

- Is the knowledge system healthy?
- How much trusted evidence exists?
- How much governed knowledge exists?
- Is knowledge successfully progressing toward canonical status?

## 5.2 Operational Metrics

Displayed second:

1. Learning
2. Organizational Memory
3. Reasoning
4. Improvement

These metrics answer:

- Is organizational learning active?
- Is memory synchronized?
- Is reasoning available and processing?
- Are governed improvement loops operating?

## 5.3 Metric Truth Rules

Every metric must use authoritative data.

Unknown values must render as unavailable or pending.

Zero is valid only when confirmed by an authoritative service.

Static labels such as Active, Synced, Queued, or Governed must not be shown
as live state unless returned by an authoritative contract.

Each production metric should eventually expose:

- Primary value
- State
- Supporting context
- Freshness
- Trend when authoritative
- Drill-down action

---

# 6. Toolbar

The toolbar owns:

- Universal knowledge search entry
- Scope selector
- Workspace tabs
- Active filters
- Refresh or live-state indicator
- Mobile inspector trigger

Workspace tabs:

- Overview
- Evidence
- Knowledge IR
- Canonical
- Graph
- Learning
- Reasoning
- Governance
- Automation

The toolbar must use:

- LuminaWorkspaceToolbar
- LuminaWorkspaceTabs
- LuminaButton

Tab state remains owned by KnowledgeOperationsWorkspace.

---

# 7. Sidebar

The sidebar is a bounded operational panel.

It shall contain:

- Executive knowledge summary
- Coverage summary
- Priority governance blockers
- Critical knowledge risks
- Chief Agent readiness summary

The sidebar must not contain a second metric dashboard.

The sidebar must prioritize actionable and blocking information.

Static executive-summary values must be replaced by authoritative state or
clearly marked unavailable states.

---

# 8. Primary Content

The primary content region owns the active operational workspace.

The default Overview composition contains:

- Knowledge Graph
- Evidence Acquisition
- Reasoning Operations
- Activity Timeline

Other tabs replace the central content without replacing the application
Shell, metrics, toolbar, sidebar, or inspector.

## 8.1 Knowledge Graph

The graph is the primary visualization.

Required production capabilities:

- Search
- Zoom and pan
- Node selection
- Relationship selection
- Source filtering
- Project filtering
- Type filtering
- Confidence filtering
- State filtering
- Lineage inspection
- Conflict highlighting
- Stale-node highlighting
- Disconnected-cluster detection
- Chief Agent visibility indication

The graph must provide actionable empty, building, degraded, and failed
states.

A blank decorative canvas is prohibited.

## 8.2 Evidence Acquisition

Required production capabilities:

- Source status
- Acquisition progress
- Files scanned
- Evidence accepted
- Evidence rejected
- Evidence awaiting processing
- Failure diagnostics
- Retry action
- Freshness
- Trust level
- Provider navigation

## 8.3 Reasoning Operations

Required production capabilities:

- Waiting queue
- Running queue
- Completed findings
- Blocked findings
- Failed findings
- Contradictions
- Confidence
- Evidence inputs
- Canonical inputs
- Governance requirements

Reasoning output must remain distinct from canonical knowledge.

## 8.4 Activity Timeline

Required production capabilities:

- Audited events only
- Chronological ordering
- Category filters
- Project filters
- Actor
- Source
- Outcome
- Correlation identifier
- Inspector navigation

Synthetic activity is prohibited.

---

# 9. Inspector

The inspector follows the Runtime Operations reference structure.

Required tabs:

- Overview
- Evidence
- Lineage
- Relationships
- Governance
- History

The inspector must support:

- Nothing selected
- Loading
- Ready
- Refreshing
- Deleted
- Superseded
- Unavailable
- Permission restricted
- Offline

Required information:

- Entity identity
- Entity type
- State
- Confidence
- Source
- Evidence lineage
- Relationships
- Governance decisions
- Version history
- Chief Agent visibility
- Available actions

The inspector must load entity details lazily.

---

# 10. Governance

Governance is a first-class operational capability.

Required queues:

- Promotion approvals
- Conflicting knowledge
- Duplicate knowledge
- Stale knowledge
- Expired evidence
- Low-confidence reasoning
- Provider trust changes
- Chief Agent access requests
- Automation authorization requests

Every governance action must:

- Use an authoritative service
- Require authoritative permission
- Produce an audit record
- Return a confirmed result
- Avoid optimistic authority-sensitive mutation

---

# 11. Chief Agent

The workspace must display:

- Current synchronized knowledge version
- Last successful synchronization
- Synchronization state
- Verification state
- Knowledge included
- Knowledge withheld
- Policy restrictions
- Failed synchronization reason
- Pending certification

Chief Agent readiness must not be inferred from local UI state.

---

# 12. Platform Health

Infrastructure metrics are secondary to knowledge-domain metrics.

A future Platform Health section may expose:

- Active workers
- Queue depth
- Processing throughput
- CPU
- Memory
- Provider connectivity
- Compiler health
- Graph compiler health
- Synchronization worker health

These metrics must not replace the executive knowledge metrics.

Platform Health belongs in:

- A dedicated system-status panel
- The sidebar
- The inspector
- Runtime Operations when infrastructure-level diagnosis is required

---

# 13. Production UI States

Every region must implement:

- Initializing
- Loading
- Ready
- Refreshing
- Empty
- Partial failure
- Offline
- Permission restricted

Long-running operations additionally support:

- Queued
- Running
- Cancelling
- Completed
- Failed

Verified data must remain visible during refresh whenever possible.

Partial failure must remain localized.

---

# 14. Accessibility

The completed workspace must support:

- Keyboard navigation
- Visible focus
- Screen-reader labels
- Logical heading hierarchy
- Reduced motion
- High contrast
- Focus restoration
- Accessible inspector drawers
- Accessible graph controls
- Non-color status communication

---

# 15. Performance

Production requirements:

- Bounded initial snapshot
- Lazy inspector loading
- Virtualized timelines
- Virtualized large lists
- Incremental graph loading
- Server-side filtering
- Cursor-based pagination
- Debounced search
- Request cancellation
- Stale-response protection

The client must not load complete large datasets merely to calculate summary
metrics.

---

# 16. Implementation Sequence

Implementation is frozen in this order:

## Phase 1 — Structural parity

- Remove duplicate metric ownership
- Implement metrics slot
- Implement Runtime-style sidebar
- Implement Runtime-style content panel
- Implement Runtime-style inspector container
- Verify responsive three-region layout

## Phase 2 — Executive metrics

- Knowledge Executive Metrics
- Knowledge Operational Metrics
- Metrics overview wrapper
- Unknown and unavailable states
- Authoritative freshness
- Remove fabricated live statuses

## Phase 3 — Command layer

- Workspace tabs
- Universal search entry
- Scope filters
- Governance navigation
- Mobile inspector trigger

## Phase 4 — Core operational panels

- Knowledge Graph
- Evidence Acquisition
- Reasoning Operations
- Activity Timeline

## Phase 5 — Governance and memory

- Canonical Memory
- Learning Intelligence
- Governance Queue
- Chief Agent synchronization
- Knowledge Lineage

## Phase 6 — Production hardening

- Permission matrix
- Offline behavior
- Partial failures
- Accessibility
- Responsive validation
- Performance validation
- Runtime and Builder regression validation

## Phase 7 — Certification

- Workspace Framework checklist
- Knowledge Operations acceptance criteria
- Visual regression evidence
- Accessibility evidence
- Performance evidence
- Production-state evidence

No phase may silently introduce mock operational truth.

---

# 17. Prohibited Drift

Implementation must not:

- Put metrics back inside the hero
- Create a Knowledge-specific page framework
- Create a second surface system
- Create a second motion system
- Create a second toolbar system
- Create a second inspector framework
- Duplicate Runtime layout ownership
- Present static placeholders as live state
- Collapse Evidence, Knowledge IR, Canonical Memory, Learning, and Reasoning
  into one undifferentiated model
- Bypass governance for Chief Agent consumption
- Add unbounded client rendering

Runtime Operations remains the required reference before any structural
workspace change.

---

# 18. Definition of Done

Knowledge Operations v1 is complete when:

- It uses all six LuminaWorkspaceLayout regions.
- The hero contains identity and actions only.
- Eight metrics are available through a two-tier metrics architecture.
- The sidebar contains authoritative summary and priority state.
- The graph is operational or presents an actionable state.
- Evidence acquisition is operational.
- Reasoning queues are operational.
- The activity timeline contains audited events only.
- The inspector provides entity lineage and governance context.
- Chief Agent synchronization state is visible.
- Empty, loading, error, offline, and permission states are complete.
- Accessibility requirements pass.
- Production-scale rendering is bounded.
- Builder and Runtime builds pass.
- Runtime Operations remains visually and behaviorally stable.
- Workspace Framework certification passes.
- Knowledge Operations certification evidence is recorded.

---

# 19. Acceptance Criteria

KOW-006 is approved when:

- It reconciles KOW-001 through KOW-005 without replacing them.
- Runtime Operations remains the canonical workspace reference.
- The complete Knowledge Operations v1 scope is frozen.
- The eight-metric architecture is preserved.
- Knowledge-domain and infrastructure metrics remain separate.
- Component ownership remains explicit.
- Data authority remains service-driven.
- Implementation can proceed without further structural redesign.
