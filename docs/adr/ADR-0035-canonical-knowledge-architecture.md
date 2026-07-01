# ADR-0035 — Canonical Knowledge Architecture

**Status:** Accepted

## Context

KoreLumina now contains multiple layers related to knowledge:

- runtime/knowledge
- docs
- apps/lumina-runtime/src/knowledge
- packages/platform-sdk

As the architecture evolves, ownership boundaries must be explicit to prevent duplicated responsibilities and documentation drift.

## Decision

Define a single canonical owner for each category of information.

### runtime/knowledge

This directory is the canonical persistent knowledge store.

It owns:

- ADRs
- architecture knowledge
- engineering knowledge
- repository knowledge
- runtime events
- project knowledge
- specifications
- decisions
- telemetry
- conversations
- embeddings
- knowledge graph data

This knowledge is intended to be read and written by the Runtime Knowledge Engine.

### docs

The docs directory is intended for human-readable documentation.

Documentation may be generated or synchronized from runtime knowledge, but it is not the canonical source of machine knowledge.

### apps/lumina-runtime/src/knowledge

This directory contains the implementation of the knowledge engine.

It contains:

- stores
- retrieval
- reasoning
- indexing
- graph processing
- persistence adapters

It does not contain canonical knowledge.

### packages/platform-sdk

The Platform SDK owns shared infrastructure that is independent of runtime execution.

Examples include:

- repository paths
- knowledge paths
- filesystem utilities
- storage abstractions
- shared contracts
- shared metadata
- shared manifests

The runtime consumes these abstractions rather than defining duplicate implementations.

## Engineering Rule

Every persistent artifact must have exactly one canonical owner.

Duplicate representations may exist only if they are generated or synchronized from the canonical source.

They must never evolve independently.

## Consequences

Benefits include:

- clear ownership boundaries
- elimination of duplicated infrastructure
- simplified maintenance
- reduced architectural drift
- easier Platform SDK extraction
- consistent Runtime Knowledge architecture

This decision establishes the governance model for future architectural reconstruction phases.
