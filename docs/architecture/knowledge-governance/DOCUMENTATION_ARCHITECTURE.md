# Documentation Architecture

## Status

Draft.

## Purpose

This document defines how KoreLumina documentation is organized and governed.

It does not replace existing architecture, constitution, governance, ADR, RFC, roadmap, or program documents.

It explains how they relate.

## Document Authority Order

1. Constitution
2. Governance
3. Master Architecture
4. Canonical Models
5. Platform Specifications
6. Capability Specifications
7. ADRs
8. RFCs
9. Programs and Roadmaps
10. Implementation Logs
11. Archive

## Rule

When two documents conflict, the higher-authority document controls unless a newer ADR explicitly supersedes it.

## Constitutional Reconciliation Required

The repository currently contains multiple constitutional documents:

- docs/architecture/00_PLATFORM_CONSTITUTION.md
- docs/governance/KORELUMINA_CONSTITUTION.md
- docs/constitution/AMENDMENT_PROCESS.md

These must be reconciled before creating or replacing a constitution.

## Knowledge Governance Rule

Documentation is evidence for the Knowledge Preservation Engine.

Active documents guide engineering.

Archived and historical documents preserve context but do not govern current implementation unless explicitly referenced by an active document.
