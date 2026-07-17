# KOW-003 — Knowledge Operations Component Tree

Status: Proposed
Depends on:
- KOW-001
- KOW-002

---

# Purpose

This document defines the canonical component hierarchy and ownership
boundaries for the reconstructed Knowledge Operations workspace.

Each component owns exactly one operational responsibility.

Business logic shall remain separated from layout and presentation.

---

# Root Tree

KnowledgeOperationsWorkspace

├── KnowledgeHero

├── KnowledgeToolbar

├── KnowledgeExecutiveHealth

├── KnowledgeGraphViewport

├── KnowledgeActivityTimeline

├── EvidencePipelinePanel

├── CanonicalMemoryPanel

├── LearningIntelligencePanel

├── ReasoningOperationsPanel

├── GovernanceQueuePanel

├── AutomationOperationsPanel

├── KnowledgeLineagePanel

├── KnowledgeSearch

└── KnowledgeInspector

---

# KnowledgeOperationsWorkspace

Owns:

- page orchestration
- loading orchestration
- panel composition
- active entity
- inspector visibility
- service coordination

Must not own:

- graph rendering
- acquisition rendering
- reasoning rendering
- governance rendering

---

# KnowledgeHero

Owns:

- workspace identity
- executive summary
- command actions
- health metrics
- synchronization state
- search entry

Consumes:

LuminaWorkspaceHero

LuminaWorkspaceBrand

LuminaMetricGrid

LuminaMetricCard

---

# KnowledgeToolbar

Owns:

- filters
- view mode
- graph mode
- date range
- source filter

Does not own:

- search
- actions

---

# KnowledgeExecutiveHealth

Owns:

- organizational health score
- subsystem health
- evidence freshness
- graph integrity
- readiness scoring

Must explain every score.

---

# KnowledgeGraphViewport

Owns:

- graph rendering
- graph interaction
- node selection
- relationship visualization
- clustering
- graph filtering

Must not own:

- inspector
- lineage details

---

# KnowledgeActivityTimeline

Owns:

- chronological events
- event filtering
- event grouping
- event navigation

Must not calculate
health metrics.

---

# EvidencePipelinePanel

Owns:

- acquisition providers
- ingestion state
- throughput
- failures
- retries

Must not render
canonical knowledge.

---

# CanonicalMemoryPanel

Owns:

- promoted knowledge
- review state
- publication history
- confidence

Must not display
learning candidates.

---

# LearningIntelligencePanel

Owns:

- discovered patterns
- emerging topics
- rejected learning
- confidence

Must remain separate
from canonical memory.

---

# ReasoningOperationsPanel

Owns:

- reasoning queues
- findings
- recommendations
- contradictions

Reasoning
is not
canonical memory.

---

# GovernanceQueuePanel

Owns:

- approvals
- conflicts
- duplicate knowledge
- stale knowledge
- policy review

Every item
must expose
available actions.

---

# AutomationOperationsPanel

Owns:

- automation status
- execution
- failures
- dependencies

Must not expose
governance decisions.

---

# KnowledgeLineagePanel

Owns:

Evidence

↓

Knowledge IR

↓

Canonical Memory

↓

Reasoning

↓

Chief Agent

Displays complete
knowledge provenance.

---

# KnowledgeSearch

Owns:

- universal search
- filters
- ranking
- shortcuts

Must never
modify data.

---

# KnowledgeInspector

Owns:

- selected entity
- provenance
- confidence
- relationships
- timeline
- actions

Inspector must remain
independent from panels.

---

# Component Dependency Rules

Panels may communicate
through the workspace.

Panels may not
directly manipulate
other panels.

The inspector
is the only
entity-details surface.

---

# Forbidden Dependencies

KnowledgeGraphViewport

must never import

GovernanceQueuePanel

EvidencePipelinePanel

must never import

ReasoningOperationsPanel

CanonicalMemoryPanel

must never import

LearningIntelligencePanel

AutomationOperationsPanel

must never import

KnowledgeGraphViewport

---

# Framework Usage

Every panel
must compose

LuminaWorkspacePanel

Every metric

must use

LuminaMetricCard

Every page

must use

LuminaWorkspaceLayout

No panel
may recreate

- glass
- hover
- elevation
- spacing
- branding
- motion

Those belong to
the Lumina framework.

---

# Acceptance

This specification is approved when:

- every component owns one responsibility

- no cyclic dependencies exist

- layout and business logic remain separated

- entity details are inspector-driven

- framework primitives remain the only UI foundation


---

# Acceptance Criteria

KOW-003 is approved when:

- Every component has exactly one clearly defined responsibility.
- Layout orchestration remains owned by KnowledgeOperationsWorkspace.
- Entity details are owned exclusively by KnowledgeInspector.
- Panels communicate only through the workspace orchestration layer.
- No cyclic component dependencies exist.
- Canonical Memory, Learning, Reasoning, and Governance remain separate domains.
- Every panel composes certified Lumina framework primitives.
- No component recreates workspace layout, branding, glass, motion, hover, or elevation.
- Business logic remains separated from presentation.
- The component hierarchy can be implemented without introducing competing UI primitives.

