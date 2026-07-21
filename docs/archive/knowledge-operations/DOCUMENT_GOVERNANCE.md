# Knowledge Operations Documentation Governance

Version: 2.0

Status: Active

Authority:
Knowledge Operations V2 Master Specification

---

# Purpose

This document governs the lifecycle of all Knowledge Operations
documentation.

Architecture documentation is treated as production code.

Only one active architectural truth may exist.

---

# Documentation Lifecycle

Draft

↓

Review

↓

Approved

↓

Active

↓

Superseded

↓

Archived

↓

Historical

Only Active documentation may drive implementation.

---

# Active Documentation

Active Knowledge Operations documentation exists only under:

docs/architecture/knowledge-operations/

and

docs/engineering/knowledge-operations/

No other directory may contain authoritative architecture.

---

# Archive

Archived documentation exists under:

docs/archive/knowledge-operations/

Archived documents remain searchable.

Archived documents never drive implementation.

---

# Archive Categories

v0-concepts

Early product thinking.

v1

Production V1 architecture.

prototypes

Experimental ideas.

experiments

Research work.

ui-explorations

Visual concepts.

discarded-architectures

Architectures intentionally abandoned.

superseded

Former production architecture replaced by V2.

---

# Archive Header

Every archived document begins with:

Status:
Archived

Superseded By:
KNOWLEDGE_OPERATIONS_V2_MASTER_SPECIFICATION.md

Reason:
Superseded during Knowledge Operations V2 reconstruction.

Do Not Use For New Development.

---

# Single Source of Truth

Architecture

↓

Master Specification

↓

Referenced Blueprint

↓

Engineering Specification

↓

Implementation

No implementation may reference archived documents.

---

# Allowed References

Engineering documents

may reference

Architecture documents.

Architecture documents

may reference

other Architecture documents.

Archived documents

may reference

historical material.

Active documents

must never reference archived material.

---

# Migration Rules

When a document becomes obsolete:

1.

Remove it from active navigation.

2.

Archive it.

3.

Record it in ARCHIVE_INDEX.md.

4.

Update replacement references.

5.

Verify no implementation references remain.

Nothing is deleted unless intentionally removed from repository history.

---

# Certification

Documentation governance is certified when:

• One active architectural authority exists.

• Archived documents cannot be mistaken for active specifications.

• Engineering references only active architecture.

• Repository history is preserved.

