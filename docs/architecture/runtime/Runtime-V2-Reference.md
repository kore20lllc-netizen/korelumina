# Runtime Operations V2 Reference Architecture

## Purpose

Runtime Operations is the canonical Lumina workspace.

Every reusable Lumina workspace primitive must first prove itself here before it is promoted into the shared framework.

Runtime Operations is therefore both:

- the production runtime dashboard
- the architectural reference implementation for Lumina workspaces

---

# Architectural Principles

1. Runtime data is the source of truth.
2. Presentation never owns business state.
3. Layout never owns business logic.
4. Shared primitives are extracted only after certification.
5. Other workspaces consume Runtime-certified primitives.

---

# Workspace Layers

RuntimeOperationsWorkspace

Responsibilities

- Runtime orchestration
- Selection state
- Filtering state
- Keyboard shortcuts
- Responsive behavior
- Delegation to presentation

No visual styling should live here.

---

# Layout Layer

RuntimeWorkspaceShell

Responsibilities

- Hero placement
- Panel composition
- Responsive regions
- Mobile adaptations

No runtime logic.

---

# Feature Components

RuntimeHeader

Responsibilities

- Workspace identity
- Metrics
- Search
- Filters

RuntimeProjectsList

Responsibilities

- Project listing
- Selection

RuntimeInspector

Responsibilities

- Runtime inspection

RuntimeLogsPanel

Responsibilities

- Runtime logs

RuntimeEventStream

Responsibilities

- Live events

RuntimeLifecycleTimeline

Responsibilities

- Timeline visualization

RuntimeHealthOverview

Responsibilities

- Aggregated health

---

# Layout Regions

Hero

Toolbar

Summary

Primary Content

Secondary Content

Inspector

Supporting Panels

---

# Promotion Pipeline

Feature Component

↓

Production Validation

↓

Accessibility Validation

↓

Responsive Validation

↓

Interaction Validation

↓

Primitive Extraction

↓

Lumina Framework

---

# Extraction Rules

A primitive must satisfy all of the following before entering Lumina:

- used by Runtime Operations
- stable API
- responsive
- accessibility reviewed
- no Runtime-specific dependencies
- no Runtime-specific naming

Only then may it become a shared Lumina component.

---

# Migration Order

1. Runtime Operations
2. Knowledge Operations
3. Repository Audit
4. Developer Workspace
5. Designer Workspace
6. Administration

---

# Long-Term Goal

Lumina is derived from certified production workspaces.

The framework must never become more abstract than the production implementations it supports.
