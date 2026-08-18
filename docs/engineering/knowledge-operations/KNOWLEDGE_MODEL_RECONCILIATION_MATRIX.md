# Knowledge Model Reconciliation Matrix

Version: 2.0

Status:
Active

Purpose:

This document reconciles every existing Knowledge domain model into the
canonical Knowledge Operations V2 object model.

No domain model may remain authoritative outside this reconciliation.

---

# Canonical Authority

The canonical production domain model is:

docs/architecture/knowledge-operations/
KNOWLEDGE_OPERATIONS_V2_KNOWLEDGE_OBJECT_MODEL.md

All other knowledge model documents must either:

• contribute content,

• become supporting references,

• or be archived.

---

# Reconciliation Matrix

| Existing Document | Primary Subject | V2 Destination | Action | Status |
|-------------------|-----------------|---------------|--------|--------|
| CANONICAL_KNOWLEDGE_MODEL.md | Canonical Knowledge | Knowledge Object Model | Merge | Pending |
| KNOWLEDGE_NATIVE_ARCHITECTURE.md | Native Architecture | Master Specification | Review | Pending |
| KEP-002-001_KNOWLEDGE_DOMAIN_MODEL.md | Domain Objects | Knowledge Object Model | Merge | Pending |
| KNOWLEDGE_INTERMEDIATE_REPRESENTATION.md | Knowledge IR | Runtime Data Contract | Merge | Pending |
| EVIDENCE_MODEL.md | Evidence | Knowledge Object Model | Merge | Pending |
| ADR-0035 | Canonical Knowledge | ADR | Retain | Pending |
| ADR-0036 | Domain Architecture | ADR | Retain | Pending |
| ADR-0038 | Acquisition Platform | ADR | Retain | Pending |
| ADR-0039 | Knowledge Scope | ADR | Retain | Pending |
| RFC-0001 | Graph Integration | Engineering Reference | Retain | Pending |

---

# Classification Rules

Merge

Unique technical content is incorporated into V2.

Retain

Historical architectural decision remains valid.

Archive

Document has been completely superseded.

Reference

Document remains informative but is not authoritative.

Delete

Generated or duplicate content only.

---

# Certification

This reconciliation is complete when:

• One canonical Knowledge Object Model exists.

• One canonical Runtime Contract exists.

• One canonical Master Specification exists.

• All remaining knowledge documents have an explicit lifecycle classification.

