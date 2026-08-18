# R17 — Canonical Knowledge Ownership Audit

Status:
In Progress

## Objective

Determine whether CanonicalKnowledgeStore instances represent
shared canonical state or isolated runtime state.

## Questions

- Who constructs CanonicalKnowledgeStore?
- Is it in-memory or persistent?
- Is there one shared instance or multiple independent instances?
- Are preserved items visible across all consumers?
- Is promotion globally visible?

## Success Criteria

The ownership and lifecycle of canonical knowledge are fully
understood before any bootstrap refactoring is attempted.

