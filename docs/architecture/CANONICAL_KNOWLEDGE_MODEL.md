# Canonical Knowledge Model

## Status

Draft v1

## Purpose

The Canonical Knowledge Model defines how KoreLumina represents engineering knowledge.

Every knowledge producer must map into this model.

Every knowledge consumer must read from this model.

## Core Principle

KoreLumina does not store random documents as knowledge.

It stores structured engineering knowledge with provenance, confidence, relationships, and lifecycle state.

## Root Entity

All knowledge records derive from `KnowledgeItem`.

## KnowledgeItem

Universal fields:

- id
- title
- description
- type
- status
- confidence
- createdAt
- updatedAt
- provenance
- relationships
- metadata

## Knowledge Types

Supported top-level knowledge types:

- Capability
- Subsystem
- Component
- Decision
- Principle
- Architecture
- Execution
- Artifact
- Evidence
- Lesson
- Incident
- Recovery
- Roadmap
- Milestone

## Capability

A capability represents something KoreLumina can do.

Examples:

- Runtime Recovery
- Engineering Planning
- Deterministic Task Planning
- Knowledge Preservation

Capabilities are central nodes in the knowledge graph.

## Subsystem

A subsystem represents a bounded technical area.

Examples:

- Runtime Kernel
- Engineering Kernel
- Knowledge Platform
- Builder
- Automation Pipeline

## Component

A component represents a source-level implementation unit.

Examples:

- EngineeringPlanner
- RuntimeLifecycleService
- EngineeringAutomationPipeline

## Decision

A decision captures a contextual architectural or engineering choice.

Example:

- Freeze Engineering Kernel APIs.

## Principle

A principle captures enduring guidance.

Examples:

- Runtime is source of truth.
- Pipelines orchestrate; services perform work.
- Aggregate roots own state.
- Green builds before checkpoint.

## Evidence

Evidence is immutable source material.

Evidence types:

- Conversation
- Commit
- Tag
- Branch
- ADR
- Source File
- Runtime Event
- Engineering Execution
- Document
- Specification
- Roadmap

## Provenance

Every knowledge item must retain evidence references.

Supported provenance references:

- conversations
- commits
- tags
- branches
- ADRs
- files
- documents
- runtime events
- engineering executions
- milestones

## Confidence

Confidence levels:

- high: supported by code, commits, and documentation
- medium: supported by at least two evidence sources
- low: inferred or conversation-only and awaiting review

## Lifecycle

Knowledge lifecycle:

1. evidence
2. candidate
3. review
4. approved
5. active
6. superseded
7. archived

## Relationships

Common relationship types:

- implements
- depends_on
- affects
- documents
- produced_by
- validated_by
- introduced_by
- supersedes
- related_to
- generated_lesson
- updates_principle

## Capability-Centered Graph

Capabilities are the primary navigation nodes.

A capability may link to:

- subsystems
- components
- source files
- commits
- ADRs
- conversations
- tests
- runtime events
- engineering executions
- lessons

## Knowledge Debt

Knowledge debt exists when important engineering knowledge is not durable or traceable.

Examples:

- decision without ADR
- capability without documentation
- conversation without extracted knowledge
- implementation without provenance
- incident without lesson

The Knowledge Preservation Engine reduces knowledge debt.

## Connector Rule

Every connector maps evidence into the Canonical Knowledge Model.

Initial connectors:

- Git Connector
- Source Connector
- ADR Connector
- Documentation Connector
- Conversation Connector
- Runtime Connector
- Engineering Execution Connector

## Consumption Rule

Engineer Agents should consume KP through the Canonical Knowledge Model instead of directly searching raw artifacts.

## Initial Implementation Priority

1. Define CKM types.
2. Build Knowledge Preservation Engine.
3. Recover Git history.
4. Recover architecture documents.
5. Recover conversations into ADR drafts.
6. Build capability graph.
7. Add semantic index.
8. Add context builder.
9. Enable continuous preservation.
