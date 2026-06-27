# KoreLumina Operating Model

## Status

Approved Governance

Version: 1.1

---

# Purpose

The KoreLumina Operating Model defines how engineering work is performed.

Its purpose is to separate long-term vision, architectural evolution, and production implementation into distinct operating modes.

This separation protects engineering focus, prevents architectural drift, and creates a repeatable engineering process for both humans and the future Engineer Agent.

---

# Core Principle

Every engineering activity shall explicitly declare its operating mode before work begins.

---

# Operating Modes

KoreLumina operates in three modes.

Vision

↓

Architecture

↓

Engineering

These modes are intentionally separated.

---

# Vision Mode

## Purpose

Define the future direction of KoreLumina.

## Produces

- Mission
- Vision
- Platform philosophy
- Long-term goals
- Strategic roadmap

## May Change

- Constitutional principles
- Platform vision

## Does Not Produce

- Production code
- ADRs
- Engineering tickets

---

# Architecture Mode

## Purpose

Convert approved vision into implementable architecture.

## Produces

- RFCs
- ADRs
- Architecture documents
- Governance updates
- Engineering roadmaps

## May Change

- Architecture
- Governance
- Roadmaps

## Does Not Produce

- Production implementation

---

# Engineering Mode

## Purpose

Implement approved architecture.

## Produces

- Production code
- Tests
- Validation
- Knowledge
- Reconciliation

## Rules

During Engineering Mode:

- Roadmap is frozen.
- Governance is frozen.
- Architecture is frozen.

Implementation follows approved architecture.

---

# Architectural Reconciliation

Architectural Reconciliation is not a fourth operating mode.

It is the transition between Engineering and future Architecture.

Engineering

↓

Validation

↓

Architectural Reconciliation

↓

Knowledge Platform

↓

Architecture (if required)

Reconciliation records evidence.

Architecture evaluates evidence.

---

# Engineering Workflow

Every engineering ticket shall declare:

Mode

Ticket

Epic

Classification

Governance Impact

Architecture Impact

Knowledge Produced

This metadata becomes part of the engineering record and is suitable for future Knowledge Platform ingestion.

---

# AI Responsibilities

## During Vision Mode

The AI assists with exploration, long-term thinking, and strategic planning.

---

## During Architecture Mode

The AI assists with:

- architecture reviews
- RFC generation
- ADR generation
- trade-off analysis
- roadmap evolution

---

## During Engineering Mode

The AI assists with:

- implementation
- debugging
- validation
- testing
- production engineering

The AI shall remain within the scope of the active engineering ticket.

Architectural observations discovered during implementation shall be recorded for future reconciliation rather than changing the active roadmap.

---

# Engineering Discipline

Engineering discipline requires:

- one ticket
- one patch
- one green build
- one commit
- one push
- one reconciliation

Large initiatives are composed of multiple atomic tickets.

---

# Knowledge Platform Integration

The Operating Model itself is engineering knowledge.

Future versions of the Engineer Agent shall use this document to determine how to participate in engineering work and when architectural discussions are appropriate.

---

# Success Criteria

The Operating Model succeeds when:

- implementation remains focused,
- architectural drift is minimized,
- governance evolves deliberately,
- engineering knowledge continuously improves,
- and the Engineer Agent follows the same engineering discipline as human engineers.

