# ADR-0039 — Knowledge Scope Architecture

## Status

Accepted

## Context

KoreLumina is designed to learn from engineering activity while preserving architectural integrity, customer isolation, and organizational trust.

The Knowledge Acquisition Platform defines how evidence enters the Engineering Intelligence Platform.

The next required boundary is scope: where knowledge belongs, who can consume it, and whether it may improve global platform intelligence.

## Decision

Introduce Knowledge Scope as a first-class architectural boundary.

All evidence, Knowledge IR, canonical knowledge, learning artifacts, retrieval results, context packages, and agent memory MUST belong to an explicit scope.

## Scope Hierarchy

    Platform Memory
        ↓
    Organization Memory
        ↓
    Project Memory
        ↓
    Session Memory
        ↓
    Task Memory

## Scope Definitions

### Platform Memory

Knowledge about KoreLumina itself.

Includes:

- KoreLumina architecture
- KoreLumina runtime behavior
- platform incidents
- internal engineering decisions
- reusable engineering patterns
- autonomous improvement history

Platform memory may improve KoreLumina's global engineering intelligence.

### Organization Memory

Knowledge owned by a customer organization or internal team.

Includes:

- organization-wide standards
- team decisions
- shared engineering patterns
- cross-project lessons
- governance policies

Organization memory MUST NOT leak across organizations.

### Project Memory

Knowledge specific to one project.

Includes:

- project architecture
- source structure
- project decisions
- runtime behavior
- bugs and fixes
- project-specific conversations

Project memory is isolated to the owning project unless explicitly promoted by governance.

### Session Memory

Temporary knowledge created during an engineering session.

Includes:

- current conversation context
- active investigation state
- temporary plans
- working assumptions

Session memory may become project or organization knowledge only through evidence capture and promotion.

### Task Memory

Short-lived context for a single task.

Includes:

- command outputs
- current error state
- proposed changes
- validation results

Task memory expires unless promoted into evidence.

## Rules

Every knowledge artifact MUST declare its scope.

Agents MUST consume only knowledge allowed by their role, organization, project, session, and task boundaries.

Customer proprietary knowledge MUST NOT be promoted into Platform Memory without explicit governance.

Platform learning may use abstracted patterns only when customer-specific details are removed.

Evidence remains immutable within its original scope.

Knowledge may be promoted across scopes only through governed policy.

## Agent Implications

Agents do not own private permanent memory.

Agents consume scoped knowledge through the Engineering Intelligence Platform.

Specialized agents may receive different context packages, but all retrieval must respect scope boundaries.

## Self-Improvement Implications

KoreLumina may improve globally from:

- internal platform engineering work
- public or approved reusable patterns
- anonymized and governed abstractions
- explicitly promoted lessons

KoreLumina must not improve globally by retaining private customer source code, secrets, proprietary architecture, or confidential business context.

## Consequences

Conversation ingestion must classify evidence by scope before preservation.

Repository ingestion must associate evidence with a project and organization.

Runtime ingestion must distinguish platform runtime events from customer project runtime events.

Future query, retrieval, learning, reasoning, and agent systems must enforce scope boundaries.

Knowledge Operations dashboards must present scope-aware views.

## Related Documents

- ADR-0038 — Knowledge Acquisition Platform Architecture
- ENGINEERING_INTELLIGENCE_PLATFORM.md
- KORELUMINA_ENGINEERING_INTELLIGENCE_ARCHITECTURE.md
- CANONICAL_KNOWLEDGE_MODEL.md
- KP_ARCHITECTURAL_RECONCILIATION.md
