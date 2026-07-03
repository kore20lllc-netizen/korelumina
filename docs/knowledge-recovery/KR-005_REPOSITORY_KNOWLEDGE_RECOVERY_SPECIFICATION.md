# KR-005 — Repository Knowledge Recovery Specification

## Status

Accepted

---

# Purpose

Define the canonical process for recovering engineering knowledge from an existing repository.

This specification governs every future recovery implementation.

Recovery implementations MUST conform to this specification.

---

# Recovery Philosophy

The repository is the first evidence corpus.

Recovery extracts existing engineering knowledge.

Recovery does not invent knowledge.

---

# Recovery Pipeline

Repository

↓

Evidence Discovery

↓

Evidence Model

↓

Knowledge Compiler

↓

Knowledge IR

↓

Normalization

↓

Validation

↓

Canonical Knowledge

↓

Knowledge Platform

---

# Evidence Sources

The recovery order is:

1. ADRs

2. RFCs

3. Architecture Documents

4. Specifications

5. Roadmaps

6. Source Files

7. Git History

8. Runtime Events

9. Conversations

10. Engineering Executions

Higher-priority evidence should always be recovered before lower-priority evidence.

---

# Evidence Classification

Recovered artifacts MUST map to existing EvidenceType values.

ADR

RFC

document

specification

roadmap

source-file

commit

tag

branch

runtime-event

conversation

engineering-execution

issue

pull-request

incident-log

build-output

No new evidence types should be introduced without an ADR.

---

# Recovery Rules

Recovery MUST be deterministic.

Recovery MUST be repeatable.

Recovery MUST be idempotent.

Evidence MUST remain immutable.

Knowledge MAY evolve.

---

# Compiler Rules

Compilers consume evidence.

Compilers never discover evidence.

Compilers never publish knowledge.

Compilers only produce KnowledgeIR.

---

# Discovery Rules

Discovery locates evidence.

Discovery does not infer knowledge.

Discovery does not normalize evidence.

Discovery does not validate evidence.

---

# Platform Responsibilities

Repository Discovery

↓

Evidence

↓

Knowledge Compiler Pipeline

↓

Normalization

↓

Validation

↓

Publishing

The platform orchestrates.

Individual services perform work.

---

# Recovery Milestones

KR-006

Documentation Evidence Discovery

KR-007

ADR Recovery

KR-008

Architecture & Specification Recovery

KR-009

Git History Recovery

KR-010

Conversation Recovery

KR-011

Runtime Recovery

KR-012

Engineering Execution Recovery

---

# Success Criteria

A repository can be recovered without modifying evidence.

Recovered evidence produces deterministic Knowledge IR.

Knowledge becomes queryable through the Knowledge Platform.

The platform continuously improves organizational engineering memory.
