# Knowledge Operations Engineering

Version: 2.0

Status:
Active

This directory contains the production engineering documentation for
Knowledge Operations V2.

Architecture defines WHAT the platform is.

Engineering defines HOW it is implemented.

---

# Read Order

1.

RECONCILIATION_MATRIX.md

2.

COMPONENT_MIGRATION_PLAN.md

3.

IMPLEMENTATION_BACKLOG.md

4.

WORK_PACKAGE_INDEX.md

---

# Engineering Principles

• Runtime is the source of truth.

• UI is the contract.

• Builder consumes runtime.

• No duplicate domain models.

• No duplicate business logic.

• One implementation per capability.

• Production-grade implementation only.

---

# Work Streams

## Builder

Workspace

Inspector

Graph

Validation

Memory

Situation Room

UI Components

---

## Runtime

Knowledge Acquisition

Compiler

IR

Validation

Canonical Knowledge

Memory

Graph

Streaming

API

Automation

---

## Integration

Builder ↔ Runtime

Streaming

Snapshots

Recovery

Authentication

Authorization

---

# Archive

Historical engineering documents belong under:

docs/archive/knowledge-operations/

---

# Authority

Engineering documentation must conform to:

docs/architecture/knowledge-operations/

The Master Specification is the governing architectural document.

