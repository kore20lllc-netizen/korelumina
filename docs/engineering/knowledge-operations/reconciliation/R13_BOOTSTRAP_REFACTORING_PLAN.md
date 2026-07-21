# R13 — Bootstrap Refactoring Plan

Status:
Draft

## Objective

Remove duplicated preservation bootstrap while preserving bounded context separation.

## Current

KnowledgePreservationPlatform

- owns compiler registry
- owns normalization registry
- owns validation registry
- owns publisher registry
- owns canonical store
- owns preserve()

KnowledgePlatform

- duplicates all of the above
- additionally owns query service
- additionally exposes promote()
- additionally exposes search()
- additionally exposes list()

## Target

KnowledgePlatform

├── KnowledgePreservationEngine
├── CanonicalKnowledgeStore
├── CanonicalKnowledgeQueryService
├── Promotion API
└── Runtime API

KnowledgePreservationEngine

- compiler
- normalization
- validation
- publishing
- preserve()

## Benefits

- Single preservation implementation
- Single registry ownership
- Single pipeline lifecycle
- Reduced maintenance cost
- Clear runtime ownership
- Preserves bounded contexts

## Migration

1. Introduce KnowledgePreservationEngine.
2. Move pipeline construction into the engine.
3. Delegate preserve() from KnowledgePlatform.
4. Update existing callers.
5. Remove duplicated bootstrap.
6. Verify public API compatibility.

