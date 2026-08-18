# R4 — Domain Model Reconciliation

Version: 2.0

Status:
In Progress

Purpose:

Reconcile every legacy Knowledge domain model into the canonical
Knowledge Operations V2 domain model.

This establishes a single production knowledge model for the entire
KoreLumina platform.

---

# Reviewed Documents

- CANONICAL_KNOWLEDGE_MODEL.md
- EVIDENCE_MODEL.md
- KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md
- KEP-002-001_KNOWLEDGE_DOMAIN_MODEL.md

Destination

- KNOWLEDGE_OPERATIONS_V2_KNOWLEDGE_OBJECT_MODEL.md

---

# Canonical Objects

| Object | Canonical Owner | Status |
|---------|-----------------|--------|
| Evidence | V2 Object Model | Pending |
| Evidence Source | V2 Object Model | Pending |
| Acquisition Session | V2 Object Model | Pending |
| Knowledge IR | V2 Object Model | Pending |
| Candidate Knowledge | V2 Object Model | Pending |
| Canonical Knowledge | V2 Object Model | Pending |
| Validation Case | V2 Object Model | Pending |
| Organizational Memory | V2 Object Model | Pending |
| Learning Pattern | V2 Object Model | Pending |
| Knowledge Relationship | V2 Object Model | Pending |
| Knowledge Graph Node | V2 Object Model | Pending |
| Knowledge Graph Edge | V2 Object Model | Pending |
| Governance Decision | V2 Object Model | Pending |
| Situation | V2 Object Model | Pending |

---

# Legacy Mapping

| Legacy Object | V2 Object | Action |
|---------------|-----------|--------|
| | | |

---

# Unique Semantics

Capture semantic concepts that appear only in legacy documents.

For each concept record:

• Preserve

• Merge

• Retire

with rationale.

---

# Runtime Impact

Identify runtime services affected.

Examples:

Knowledge Acquisition

Compiler

Validation

Memory

Graph

Automation

API

Streaming

---

# Builder Impact

Identify UI affected.

Examples:

Evidence Explorer

Graph Explorer

Validation

Knowledge Packet

Inspector

Executive Situation Room

---

# Exit Criteria

The reconciliation is complete when:

• Every domain object has one canonical definition.

• Duplicate terminology has been eliminated.

• Runtime ownership is documented.

• Builder ownership is documented.

• Legacy documents are ready for archival.

