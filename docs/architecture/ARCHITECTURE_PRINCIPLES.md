# KoreLumina Architecture Principles

This document defines the immutable engineering principles governing KoreLumina.

These principles take precedence over implementation convenience.

---

# 1. Single Capability Ownership

Every architectural capability has exactly one production owner.

Consumers may depend on the owner.

Consumers must never duplicate implementation.

---

# 2. Layer Independence

Lower layers never depend on higher layers.

Platform SDK
    ↑
Runtime
    ↑
Builder

Dependencies flow upward only.

---

# 3. Platform First

Reusable infrastructure belongs in the Platform SDK.

Applications consume the SDK.

Applications do not own reusable infrastructure.

---

# 4. Runtime Owns Runtime

The Runtime owns:

- lifecycle
- orchestration
- supervision
- preview
- isolation

The Platform SDK never owns runtime orchestration.

---

# 5. Builder Owns UI

Builder owns:

- presentation
- interaction
- UX
- state management

Builder never owns runtime behavior.

---

# 6. Capability Extraction

Extraction order:

Investigate

↓

Ownership Analysis

↓

Platform Extraction

↓

Consumer Migration

↓

Validation

↓

Documentation

↓

Commit

No capability extraction is complete until documentation is updated.

---

# 7. Documentation is Architecture

Every architectural change updates:

- Architecture Changelog
- Capability Ownership
- ADR (when required)
- Platform SDK Roadmap

Documentation is part of the implementation.

---

# 8. No Architectural Drift

If duplicate ownership appears:

- investigate
- identify owner
- migrate
- validate
- document

Never accept permanent duplication.

---

# 9. Production First

Every extraction must satisfy:

Platform SDK build

Runtime build

Builder build

Workspace build

before merge.

---

# 10. Knowledge Preservation

Every architectural decision must become repository knowledge.

Conversation history is temporary.

Repository documentation is authoritative.
