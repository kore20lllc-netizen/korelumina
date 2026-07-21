# KoreLumina Engineering Workflow Standard

**Version:** 1.0
**Status:** Active
**Applies To:** All KoreLumina implementation work

---

# Purpose

This document defines the operational workflow used during KoreLumina reconstruction.

Its objectives are to:

- maximize engineering throughput
- minimize context switching
- eliminate architectural drift
- maintain production-grade quality
- ensure every completed milestone becomes a stable foundation

This document complements the architecture documentation. It governs **how implementation work is executed**, not the architecture itself.

---

# Core Principles

## Production First

KoreLumina is a production operating system.

It is **not** an MVP.

Every implementation should be production quality unless explicitly stated otherwise.

---

## Runtime Leads

During active development:

- Runtime evolves first.
- Lumina remains stable.
- Mature Runtime patterns are promoted into Lumina only after they have proven themselves.

Never redesign Lumina while Runtime is still evolving.

---

## UI Is the Contract

Visual behavior is part of the architecture.

Completion requires:

- production UX
- production visual quality
- architectural correctness
- successful build
- successful validation

---

# Operating Modes

The project has two explicit operating modes.

---

## Architecture Mode

Purpose:

- planning
- architecture
- design
- reviews
- audits

No implementation occurs in this mode.

---

## Implementation Mode

Purpose:

- implement production code
- request repository context
- build
- validate
- commit

Implementation mode should not pause for architectural discussion unless a genuine architectural conflict is discovered.

---

# Standard Implementation Cycle

Every production ticket follows this sequence.

## 1. Identify the Ticket

Example

RT-007 — Runtime Executive Deck

---

## 2. Request Repository Context

Only request the minimum repository context required.

Preferred:

```bash
sed -n '360,460p' path/to/file.tsx
