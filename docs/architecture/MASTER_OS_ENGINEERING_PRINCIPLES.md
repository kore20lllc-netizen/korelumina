# Master OS Engineering Principles

Status: Approved

Version: 1.0

---

# Purpose

This document defines the mandatory engineering methodology for building every KoreLumina Master OS subsystem.

It applies to:

- Knowledge Operations
- Runtime Diagnostics
- Repository Audit
- Deployment Center
- Organizational Memory
- AI Orchestrator
- Future Master OS modules

---

# Core Principle

Master OS modules are built operational-surface first.

A subsystem must expose a complete, production-quality operating interface before automation, intelligence, ingestion, orchestration, or autonomous behavior is layered on top.

---

# Mandatory Build Order

Every Master OS module follows this lifecycle:

Vision

↓

Information Architecture

↓

Workspace Design System

↓

Production UI Shell

↓

Runtime Contracts

↓

Runtime Integration

↓

Observability

↓

Live Data

↓

Automation

↓

Intelligence

---

# Operational Surface First

Every module must first answer:

What is happening?

Where is it happening?

What is healthy?

What is failing?

What is pending?

What changed?

What requires action?

If the operator cannot observe the subsystem, the subsystem is not ready for automation.

---

# UI Before Intelligence

The production workspace must exist before the intelligence engine is implemented.

The UI may initially display empty states, placeholders, and zero-value metrics, but the structure must represent the final operational model.

This prevents intelligence systems from being built without a usable operating surface.

---

# Contracts Before Implementation

Runtime contracts must be defined before backend capability is fully implemented.

APIs may initially return empty collections or idle states.

Contracts must be stable enough for the workspace to render, validate, and evolve incrementally.

---

# Observability Before Automation

Automation must not be introduced until the system exposes:

- status
- progress
- queue state
- provider health
- error state
- recent activity
- runtime metrics
- recovery state

An automated system without observability is not production-ready.

---

# Progressive Capability Activation

Capabilities are activated in layers:

1. Interface exists
2. Contract exists
3. Empty state renders
4. Runtime returns stable response
5. Observability renders
6. Real data appears
7. Actions are enabled
8. Automation is enabled
9. Intelligence is enabled

No layer may bypass the prior layer without an approved exception.

---

# Proven Pattern

This methodology is proven by the Lumina Builder reconstruction.

Lumina Builder was created as a production-grade operating surface first, then progressively wired into the KoreLumina backend runtime.

Although wiring remains incomplete in some areas, the architecture remained stable because the interface, workspace model, and integration contracts existed before backend completion.

Knowledge Operations follows the same model:

Workspace Design System

↓

Knowledge Operations UI

↓

Runtime integration

↓

Observability

↓

Ingestion

↓

Classification

↓

Organizational Memory

↓

Agent intelligence

---

# No Backend-Only Intelligence

Do not build isolated intelligence engines that have no operating workspace.

Do not build ingestion pipelines that cannot be observed.

Do not build automation that cannot be paused, inspected, diagnosed, or recovered.

---

# Source of Truth

Runtime is the authoritative operational source.

Builder renders runtime state.

Builder does not invent operational state.

---

# Workspace Design System Requirement

Every Master OS module must use the Workspace Design System.

Required primitives:

- WorkspaceLayout
- GlassWorkspaceHero
- WorkspaceTabBar
- WorkspaceGrid
- WorkspaceSection
- WorkspaceCard
- WorkspaceMetricCard
- WorkspaceEmptyState
- WorkspaceLoading
- WorkspaceStatusBadge

No module may create a custom dashboard framework.

---

# Recovery Rule

Every completed layer must produce a green recovery milestone.

A milestone is complete only when:

- implementation is scoped
- build is green
- behavior is validated
- commit is created
- tag is created
- remote is updated

---

# Knowledge Platform Rule

Every Master OS implementation must generate reusable engineering knowledge.

Examples:

- architecture decisions
- runtime contracts
- UI contracts
- integration pitfalls
- debugging patterns
- migration rules
- recovery anchors
- known failure modes

Knowledge created during implementation must be preserved in the repository and later ingested into the Knowledge Platform.

---

# Mandatory Checklist

Before beginning a new Master OS module:

- Workspace name is defined
- Operating purpose is defined
- Primary operator questions are defined
- UI shell is planned
- Runtime contracts are identified
- Observability requirements are listed
- Empty states are designed
- Loading states are designed
- Recovery behavior is defined
- Build milestones are planned

Before enabling automation:

- Operational dashboard exists
- Runtime state is visible
- Errors are visible
- Progress is visible
- Recovery state is visible
- Manual control exists
- Logs or activity history exist

Before enabling intelligence:

- Data sources are visible
- Evidence flow is visible
- Candidate output is visible
- Human review path exists
- Canonical output path exists
- Rollback or correction path exists

---

# Final Rule

If the operator cannot see, understand, and recover the subsystem, the subsystem is not ready for automation or intelligence.
