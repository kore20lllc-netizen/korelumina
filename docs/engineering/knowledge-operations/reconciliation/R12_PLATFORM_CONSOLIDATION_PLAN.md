# R12 — Platform Consolidation Plan

Status:
Draft

## Current State

KnowledgePreservationPlatform and KnowledgePlatform each construct:

- Compiler Registry
- Normalization Registry
- Validation Registry
- Publisher Registry
- Compiler Pipeline
- Normalization Pipeline
- Validation Pipeline
- Publishing Pipeline
- Canonical Knowledge Store

KnowledgePlatform additionally provides:

- CanonicalKnowledgeQueryService
- promote()
- search()
- list()

## Assessment

The preservation lifecycle is duplicated.

The query lifecycle exists only in KnowledgePlatform.

## Target Architecture

KnowledgePlatform

├── Preservation Pipeline
├── Canonical Store
├── Query Service
├── Promotion Service
└── Context Services

KnowledgePreservationPlatform becomes either:

- an internal implementation owned by KnowledgePlatform, or
- is removed after migration if it has no distinct responsibility.

## Migration Preconditions

- Verify all callers of createKnowledgePreservationPlatform().
- Verify RepositoryKnowledgePreserver dependencies.
- Verify DocumentationKnowledgeRecovery dependencies.
- Verify smoke tests.
- Preserve public API compatibility during migration.

