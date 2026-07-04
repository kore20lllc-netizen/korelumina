---
title: KEP-002.001 — Knowledge Domain Model
status: Canonical
owner: Chief Systems Architect
authority: Master OS
version: 1.0.0
phase: KEP-002
mission: 001
---

# Purpose

This document establishes the canonical domain model for the KoreLumina Knowledge Platform.

The domain model is frozen before implementation begins.

No subsystem may introduce competing domain models.

---

# Principle

Knowledge is represented through specialized entities.

Generic records are ingestion artifacts.

Engineering intelligence is built upon structured domain objects.

---

# Domain Hierarchy

Knowledge
│
├── Capability
├── Engineering Decision
├── Architecture Artifact
├── Repository Artifact
├── Runtime Artifact
├── Mission
├── Operational Knowledge
├── Learning Record
├── Genome Contribution
└── Relationship

KnowledgeRecord remains the universal ingestion format.

It shall never become the primary engineering model.

---

# Capability

Represents an organizational capability.

Fields include:

- id
- name
- description
- division
- owner
- maturity
- status
- dependencies
- producedKnowledge
- consumedKnowledge
- eventsPublished
- eventsConsumed
- interfaces
- metrics
- genomeContribution

Capabilities are the primary units of organizational capability.

---

# Engineering Decision

Represents an architectural or engineering decision.

Includes:

- rationale
- alternatives
- evidence
- consequences
- review history
- related capabilities
- related missions

Engineering Decisions become part of Organizational Memory.

---

# Architecture Artifact

Represents architectural knowledge.

Examples:

- Blueprint
- Constitution
- ADR
- Architecture Baseline
- Standards

---

# Repository Artifact

Represents source-code level knowledge.

Examples:

- repository
- package
- project
- module
- service
- API
- endpoint

Repository Intelligence produces Repository Artifacts.

---

# Runtime Artifact

Represents runtime behavior.

Examples:

- process
- metrics
- lifecycle
- diagnostics
- runtime events
- recovery events

Runtime Intelligence produces Runtime Artifacts.

---

# Mission

Represents engineering execution.

Includes:

- objective
- outcome
- affected capabilities
- lessons learned
- produced knowledge
- genome contributions

---

# Operational Knowledge

Represents validated operational experience.

Examples:

- deployment patterns
- recovery procedures
- troubleshooting
- production incidents
- operational improvements

---

# Learning Record

Represents organizational learning.

Includes:

- observation
- validation
- impact
- confidence
- adoption status

Learning Records evolve Organizational Memory.

---

# Genome Contribution

Represents permanent organizational improvement.

Examples:

- engineering patterns
- governance improvements
- architectural improvements
- operational improvements
- knowledge improvements

Genome Contributions increase organizational capability.

---

# Relationship

Knowledge entities are connected through typed relationships.

Examples:

- depends_on
- produces
- consumes
- improves
- replaces
- implements
- documents
- validates
- supersedes
- governs

Relationships form the Knowledge Graph.

---

# Canonical Flow

Repository

↓

Repository Artifact

↓

Capability

↓

Mission

↓

Engineering Decision

↓

Learning Record

↓

Genome Contribution

↓

Organizational Memory

↓

Chief Agent

---

# Domain Rule

Every Knowledge Platform implementation shall use these canonical entities.

No subsystem may introduce competing representations of these concepts.

The domain model is the single source of truth for organizational knowledge.

