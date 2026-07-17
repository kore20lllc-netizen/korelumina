# KOW-005 — Knowledge Operations UI State Contract

Status: Proposed for approval

Depends on:

- KOW-001
- KOW-002
- KOW-003
- KOW-004

---

# 1. Purpose

This document defines every UI state used by the Knowledge Operations
workspace.

Every panel shall support the same operational state model.

No panel may invent additional undocumented states.

---

# 2. Global Workspace States

The workspace supports:

- Initializing
- Loading
- Ready
- Refreshing
- Partial Failure
- Offline
- Permission Restricted
- Empty
- Synchronizing
- Maintenance

The Shell owns global state presentation.

Panels own local state presentation.

---

# 3. Initializing

Purpose:

Application boot.

Display:

- Hero skeleton
- Metric skeletons
- Panel skeletons

Do not display:

- Zero metrics
- Fake activity
- Placeholder percentages

Transition:

Initializing

↓

Loading

---

# 4. Loading

Definition:

Authoritative request in progress.

Display:

- Skeletons
- Stable layout
- Disabled mutating actions

Rules:

Existing verified data remains visible during refresh when possible.

---

# 5. Ready

Definition:

Authoritative data successfully loaded.

Requirements:

- Timestamp visible
- Refresh available
- Inspector functional
- Search enabled

---

# 6. Refreshing

Definition:

Operator or background refresh.

Requirements:

- Preserve layout
- Preserve selection
- Preserve scroll position
- Preserve inspector

Indicate refresh without replacing verified data.

---

# 7. Empty

Definition:

No authoritative knowledge exists.

Empty must explain WHY.

Examples:

No repositories.

No evidence.

No canonical memory.

No providers.

Required actions:

- Register Source
- Import Repository
- Acquire Evidence
- Configure Providers

---

# 8. Partial Failure

Definition:

One subsystem unavailable.

Healthy panels continue operating.

Failed panel displays:

- Service
- Failure summary
- Retry
- Last update

---

# 9. Offline

Definition:

Runtime or KPP unreachable.

Display:

Offline banner.

Disable:

- Mutations
- Governance actions
- Synchronization

Existing verified data may remain visible but must be marked stale.

---

# 10. Permission Restricted

Definition:

User lacks authority.

Do not report permission errors as service failures.

Unavailable actions:

- Hidden

or

- Disabled with explanation

---

# 11. Synchronizing

Definition:

Chief Agent synchronization or long-running operation.

Display:

Progress.

Affected entity.

Current stage.

Elapsed time.

Estimated completion when available.

---

# 12. Maintenance

Definition:

Service intentionally unavailable.

Display:

Maintenance notice.

Do not display retry loops.

---

# 13. Panel State Matrix

Every operational panel shall support:

✓ Loading

✓ Ready

✓ Empty

✓ Refreshing

✓ Partial Failure

✓ Offline

✓ Permission Restricted

Inspector additionally supports:

- Entity Deleted
- Entity Superseded
- Entity Moved

---

# 14. Metric States

Metrics must support:

- Unknown
- Pending
- Verified
- Degraded

Zero is never a substitute for Unknown.

---

# 15. Timeline States

Timeline supports:

- Empty
- Streaming
- Historical
- Offline

Synthetic activity is prohibited.

---

# 16. Graph States

Graph supports:

- Building
- Ready
- Empty
- Degraded
- Failed

A failed rebuild must preserve the last verified snapshot.

---

# 17. Search States

Search supports:

- Idle
- Searching
- Results
- Empty
- Error
- Offline

---

# 18. Inspector States

Inspector supports:

- Nothing Selected
- Loading
- Ready
- Deleted
- Superseded
- Permission Restricted
- Offline

---

# 19. Accessibility

Every state must expose:

- Keyboard navigation
- Screen reader text
- Visible focus
- Reduced-motion behavior

---

# 20. Acceptance Criteria

KOW-005 is approved when:

- Every panel uses the documented state model.
- Empty states explain the absence of data.
- Partial failures remain localized.
- Offline behavior is consistent.
- Unknown metrics are never represented as zero.
- Synthetic operational data is prohibited.
- State transitions preserve user context.
