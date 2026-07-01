# ADR-0036 — Canonical Knowledge Domain Architecture

Status: Accepted

## Context

The KoreLumina Knowledge Operating System now contains multiple independent
knowledge domains that share the same architectural responsibilities.

## Decision

All future knowledge domains shall conform to the canonical Knowledge Domain
architecture.

## Canonical Components

- Model
- Manifest
- Store
- Query
- Service
- Lifecycle
- Recorder
- Projection
- Replay Support
- Validation
- Index

Components may be introduced incrementally, but domains must not diverge from
the canonical architecture.

## Publication Flow

Producer
→ KnowledgePublisher
→ KnowledgePipeline
→ KnowledgeProcessors
→ KnowledgeEventBus
→ KnowledgeEventDispatcher
→ Subscribers
→ Event Journal
→ Replay
→ Projections

## Consequences

The Platform SDK will become the single source of reusable domain primitives.
Future domains should compose the SDK instead of reimplementing common behavior.
