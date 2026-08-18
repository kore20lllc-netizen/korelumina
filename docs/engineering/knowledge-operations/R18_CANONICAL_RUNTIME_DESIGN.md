# R18 — Canonical Knowledge Runtime Design

Status:
Draft

## Problem

CanonicalKnowledgeStore is instantiated independently by:

- KnowledgePlatform
- KnowledgePreservationPlatform

Each instance owns:

- CanonicalKnowledgeRegistry
- KnowledgePromoter
- KnowledgePromotionPolicy

Result:

Canonical knowledge is isolated per platform instance.

The runtime has no authoritative canonical knowledge owner.

---

## Target

Introduce a single runtime-owned CanonicalKnowledgeStore.

Runtime

│

├── CanonicalKnowledgeStore

│

├── KnowledgePlatform

│       │

│       └── Query / Search / Promotion

│

└── KnowledgePreservationPlatform

        │

        └── Preserve()

Both bounded contexts operate on the same canonical state.

---

## Principles

- One runtime owner
- One canonical registry
- One promotion policy
- One promotion pipeline
- Shared query surface
- Shared preservation surface

---

## Non-Goals

Do not merge bounded contexts.

Do not merge runtime APIs.

Only consolidate ownership of canonical state.

