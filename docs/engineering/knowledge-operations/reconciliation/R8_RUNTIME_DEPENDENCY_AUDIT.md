# R8 — Runtime Dependency Audit

Version: 2.0

Status:
In Progress

Purpose

Validate that runtime dependencies follow the intended bounded context
architecture.

This audit identifies illegal dependencies, cyclic dependencies,
boundary violations, and opportunities for dependency inversion.

---

# Intended Dependency Graph

Knowledge Acquisition

↓

Knowledge Preservation

↓

Canonical Knowledge

↓

Knowledge Platform

↓

Knowledge Operations

The shared kernel (knowledge/) may be consumed by any bounded context.

No bounded context may depend upward.

---

# Allowed Dependencies

Knowledge Acquisition

Consumes

Shared Kernel

Produces

Evidence

---

Knowledge Preservation

Consumes

Knowledge Acquisition

Shared Kernel

Produces

Knowledge IR

Validated Knowledge

---

Canonical Knowledge

Consumes

Knowledge Preservation

Shared Kernel

Produces

Canonical Knowledge

---

Knowledge Platform

Consumes

Canonical Knowledge

Shared Kernel

Produces

Knowledge Context

---

Knowledge Operations

Consumes

Everything above

Produces

Workspace API

Operational Projections

---

# Audit Matrix

| Package | Depends On | Allowed | Notes |
|----------|------------|---------|-------|

---

# Violations

Record every:

• upward dependency

• cyclic dependency

• runtime shortcut

• duplicate abstraction

• direct infrastructure dependency

---

# Refactoring Candidates

| Package | Issue | Recommendation | Priority |
|----------|-------|----------------|----------|

---

# Certification

The runtime dependency graph is certified when:

• No cyclic dependencies exist.

• No bounded context depends upward.

• Shared kernel is consumed but not owns business logic.

• Knowledge Operations is the only UI-facing aggregation layer.

