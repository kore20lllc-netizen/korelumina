# KOW-002 — Knowledge Operations Layout Contract

Status: Proposed for approval
Depends on: KOW-001
Visual reference: Runtime Operations
Framework authority: Lumina Workspace Framework

---

# 1. Purpose

This document defines the responsive layout, information priority, panel
geometry, scrolling behavior, and inspector placement for the reconstructed
Knowledge Operations workspace.

The layout must support operational work rather than decorative dashboard
composition.

The workspace must remain understandable when:

- Data is unavailable
- Only one source is configured
- Thousands of knowledge entities exist
- Governance queues are large
- The graph is disconnected
- The Chief Agent is unavailable
- The viewport is narrow
- Reduced-motion mode is active

---

# 2. Root Ownership

The application Shell owns:

- Lumina background
- Ambient lighting
- Application navigation
- Top bar
- Bottom dock
- Appearance provider
- Global dialogs
- Command palette

KnowledgeOperationsWorkspace owns:

- Domain data orchestration
- Workspace composition
- Active entity selection
- Inspector state
- Panel-level loading and error state
- Knowledge-specific commands

KnowledgeOperationsWorkspace must not mount:

- A second background
- A second appearance provider
- Independent global navigation
- Independent application chrome

---

# 3. Framework Composition

The workspace root must use:

- LuminaWorkspaceLayout
- LuminaWorkspaceHero
- LuminaWorkspaceBrand
- LuminaWorkspaceToolbar
- LuminaWorkspacePanel
- LuminaMetricGrid
- LuminaMetricCard
- LuminaSurface

The intended root composition is:

LuminaWorkspaceLayout

- Header
- Metrics
- Toolbar
- Main operational content
- Contextual inspector

Domain components must not reproduce the framework's outer spacing,
maximum width, panel radius, blur, shadow, or elevation.

---

# 4. Desktop Layout

Desktop breakpoint:

- 1280 pixels and above

Maximum workspace width:

- 1600 pixels

Outer spacing:

- Defined by LuminaWorkspaceLayout
- No local duplicate max-width wrapper
- No local duplicate page padding

The desktop layout contains five operational regions.

---

# 5. Region A — Executive Hero

Position:

- First full-width region

Minimum height:

- Defined by LuminaWorkspaceHero
- Must not be reduced below the Runtime Operations reference without
  framework certification

Content hierarchy:

1. KoreLumina brand
2. Knowledge Operations workspace title
3. Workspace mission statement
4. Knowledge health and readiness metrics
5. Primary actions
6. Universal knowledge search
7. Current synchronization state

Required actions:

- Back
- Refresh
- Acquire
- Review
- Providers
- Settings

Required metrics:

- Knowledge health
- Evidence
- Canonical knowledge
- Governance queue
- Chief Agent readiness
- Last synchronization

Unavailable values must display as unavailable, not zero.

Zero is valid only when the authoritative service confirms a real zero.

---

# 6. Region B — Operational Command Grid

Desktop composition:

- Three columns

Column proportions:

- Left: minimum 300 pixels, preferred 330 pixels
- Center: flexible, largest region
- Right: minimum 360 pixels, preferred 400 pixels

The center column must receive the largest available width.

## Left Column

Contains:

- Executive Health
- Governance Summary
- Priority Risks

Order:

1. Executive Health
2. Governance Summary
3. Priority Risks

The left column answers:

- Is knowledge healthy?
- What requires authority?
- What could harm Chief Agent reliability?

## Center Column

Contains:

- Knowledge Graph
- Graph toolbar
- Graph status
- Graph empty or failure state

The graph is the primary operational visualization.

The center column must not contain unrelated summary cards.

## Right Column

Contains:

- Activity Timeline
- Chief Agent synchronization
- Priority Alerts

Order:

1. Priority Alerts
2. Activity Timeline
3. Chief Agent Synchronization

The right column answers:

- What changed recently?
- What requires immediate attention?
- Is the Chief Agent synchronized?

---

# 18. Permission Layout

The workspace shall support:

- Full operator
- Reviewer
- Read-only
- Governance administrator
- Source administrator
- Chief Agent administrator

Permission denial shall never appear as a service failure.

Unavailable actions shall either:

- be hidden, or
- be disabled with an explanation.

---

# 19. Responsive Priority

Responsive layouts shall preserve operational priority rather than visual order.

Highest priority:

- Alerts
- Governance blockers
- Chief Agent readiness
- Acquisition failures
- Knowledge health

Lowest priority:

- Historical timelines
- Archived automations
- Historical metrics
- Historical graph statistics

---

# 20. Visual Density

Panels shall emphasize operational clarity.

Avoid:

- duplicate metrics
- decorative labels
- repeated summaries
- oversized empty cards

Prefer:

- progressive disclosure
- inspector-driven detail
- concise headers
- actionable queues

---

# 21. Performance

The layout shall support production-scale datasets.

Rendering requirements:

- graph virtualization
- timeline virtualization
- lazy inspector loading
- incremental graph loading
- server-side filtering
- bounded scrolling

Layout recalculation shall remain bounded.

---

# 22. Accessibility

The layout shall support:

- keyboard navigation
- screen readers
- high contrast
- reduced motion
- visible focus indicators

Inspector, drawers, dialogs, and graph interactions shall remain keyboard
accessible.

---

# 23. Acceptance Criteria

KOW-002 is approved when:

- LuminaWorkspaceLayout is the only page layout.
- The hero occupies the full-width executive region.
- The graph is the dominant operational visualization.
- Desktop, tablet, and mobile layouts are defined.
- Inspector behavior is defined.
- Loading, empty, error, offline, and permission states are complete.
- Responsive priority is documented.
- Large datasets have bounded rendering requirements.
- No duplicate workspace framework is introduced.

