# R15 — Preservation Engine Migration Impact Analysis

Status:
In Progress

Purpose

Determine the implementation impact of introducing a single
KnowledgePreservationEngine and removing duplicated bootstrap logic.

---

# Current Callers

## KnowledgePreservationPlatform

- RepositoryKnowledgePreserver
- DocumentationKnowledgeRecovery

## KnowledgePlatform

- RuntimeKnowledgeProvider

---

# Public API Comparison

KnowledgePreservationPlatform

- preserve()

KnowledgePlatform

- preserve()
- promote()
- search()
- list()

---

# Migration Strategy

Phase 1

Extract common preservation bootstrap into
KnowledgePreservationEngine.

No behavior changes.

Phase 2

KnowledgePlatform delegates preserve() to the engine.

Phase 3

KnowledgePreservationPlatform delegates preserve() to the same engine.

Phase 4

Remove duplicated registry and pipeline construction.

Phase 5

Regression test all existing callers.

---

# Risks

- Pipeline initialization order
- Registry lifetime
- Store ownership
- Query service coupling
- Canonical promotion semantics

---

# Success Criteria

- Single preservation implementation
- Single registry ownership
- No public API changes
- No behavior regressions
- Existing callers remain functional

