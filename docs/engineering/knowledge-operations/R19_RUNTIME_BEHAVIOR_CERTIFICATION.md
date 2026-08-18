# R19 — Runtime Behavior Certification

Status:
In Progress

## Objective

Determine whether canonical knowledge produced by the preservation
pipeline is expected to be visible through the runtime query API.

## Questions

1. Is CanonicalKnowledgeStore intentionally in-memory?
2. Is each platform expected to own its own store?
3. Does RuntimeKnowledgeProvider query preserved knowledge?
4. Is there a persistence layer planned but not implemented?
5. Are preservation and runtime separate execution scopes?

## Success Criteria

The intended visibility of canonical knowledge is documented.

No architectural changes are made until expected behavior is confirmed.

