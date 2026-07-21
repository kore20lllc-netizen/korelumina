# R7 — Runtime Bounded Context Reconciliation

Status:
In Progress

Purpose

Define the bounded contexts of the Knowledge runtime.

This document establishes architectural ownership for every runtime
package and prevents accidental consolidation of intentionally
separated domains.

---

# Runtime Architecture

Knowledge Acquisition

↓

Knowledge Preservation

↓

Canonical Knowledge

↓

Knowledge Platform

↓

Knowledge Operations

---

# Bounded Contexts

## Knowledge Acquisition

Location

apps/lumina-runtime/src/knowledge-acquisition/

Responsibilities

• Collect evidence

• Schedule acquisition

• Execute providers

• Produce acquisition metrics

Produces

Evidence

Acquisition Jobs

Acquisition Reports

Consumes

Nothing

---

## Knowledge Preservation

Location

apps/lumina-runtime/src/knowledge-preservation/

Responsibilities

• Compile

• Normalize

• Validate

• Publish

Produces

Knowledge IR

Validated Knowledge

Consumes

Evidence

---

## Canonical Knowledge

Location

apps/lumina-runtime/src/canonical-knowledge/

Responsibilities

• Promote

• Govern

• Store

• Query

Produces

Canonical Knowledge

Consumes

Validated Knowledge

---

## Knowledge Runtime

Location

apps/lumina-runtime/src/knowledge/

Responsibilities

Shared runtime domain model.

Contains

• Knowledge IR

• Evidence

• Graph

• Organizational Memory

• Query

• Store

Status

Shared kernel.

Not an independent business domain.

---

## Knowledge Platform

Location

apps/lumina-runtime/src/knowledge-platform/

Responsibilities

Build runtime context for agents.

Consumes

Canonical Knowledge

Graph

Memory

Produces

Knowledge Context

---

## Knowledge Operations

Location

apps/lumina-runtime/src/knowledge-operations/

Responsibilities

Operational aggregation layer.

Provides

Workspace API

Operational projections

Executive metrics

UI-facing services

Consumes

All upstream bounded contexts.

---

# Shared Kernel

The following packages are intentionally shared:

• knowledge/ir

• knowledge/graph

• knowledge/query

• knowledge/organizational-memory

• knowledge/types

• knowledge/store

These are domain primitives.

They are not duplicate implementations.

---

# Candidate Refactors

| Package | Recommendation | Priority |
|----------|----------------|----------|
| knowledge/types | Keep shared | P0 |
| knowledge/ir | Keep shared | P0 |
| knowledge/query | Keep shared | P1 |
| knowledge/store | Review API | P1 |
| knowledge/graph | Keep shared | P0 |
| organizational-memory | Integrate providers | P1 |

---

# Certification

Every runtime package has a single bounded context owner.

No shared kernel package is mistaken for a business domain.

