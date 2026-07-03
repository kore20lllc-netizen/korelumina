# ADR-0038 — Knowledge Acquisition Platform Architecture
## Status
Accepted
## Context
KoreLumina is an Engineering Operating System.
Its Engineering Intelligence Platform depends on the continuous capture of engineering evidence from every meaningful engineering activity.
The existing architecture already defines Governance, Knowledge Platform, Knowledge Graph, Retrieval, Context, Learning, Reasoning, Engineer Agents, and Autonomous Operations.
However, the architecture needs an explicit acquisition layer that owns the collection and classification of engineering evidence before it enters the Knowledge Platform.
## Decision
Introduce the Knowledge Acquisition Platform as a first-class subsystem of the Engineering Intelligence Platform.
The Knowledge Acquisition Platform is the exclusive producer of engineering evidence.
All knowledge ingestion must flow through acquisition providers that emit canonical EvidenceItem records.
## Architecture
```text
Engineering Activity
        ↓
Knowledge Acquisition Platform
        ↓
EvidenceItem
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
        ↓
Knowledge Graph
        ↓
Retrieval
        ↓
Context
        ↓
Learning
        ↓
Reasoning
        ↓
Agent Platform
        ↓
Autonomous Operations

Acquisition Providers

The Knowledge Acquisition Platform may include providers for:

* Repository files
* Documentation
* ADRs
* RFCs
* Git commits
* Git branches
* Git tags
* Pull requests
* Issues
* Runtime events
* Build output
* Deployment events
* Telemetry
* Incidents
* Engineering executions
* Builder activity
* Designer activity
* Developer activity
* AI conversations
* Customer feedback

Each provider emits EvidenceItem records only.

Providers do not compile, normalize, validate, promote, or publish knowledge.

Evidence Rule

Every engineering activity that may improve KoreLumina’s future engineering capability should produce evidence.

Evidence is immutable.

Knowledge may evolve.

Agent Rule

Agents do not own isolated memory.

Agents consume shared platform knowledge through the Engineering Intelligence Platform.

The Agent Platform may create specialized agents, but all agents learn from the same canonical knowledge substrate.

Self-Healing Rule

Self-healing must follow the governed intelligence loop:

Failure
    ↓
Evidence
    ↓
Knowledge
    ↓
Learning
    ↓
Reasoning
    ↓
Recovery Plan
    ↓
Execution
    ↓
Validation
    ↓
New Evidence

A recovery action is not complete until its outcome has been captured as evidence.

Consequences

Repository recovery becomes one acquisition provider, not the whole ingestion architecture.

Git recovery, conversation recovery, runtime recovery, issue recovery, PR recovery, and deployment recovery must use the same acquisition pattern.

The Knowledge Platform receives evidence through a consistent acquisition pipeline.

The Engineering Intelligence Platform can continuously improve as KoreLumina is built and used.

Supersedes

None.

Related Documents

* ENGINEERING_INTELLIGENCE_PLATFORM.md
* KORELUMINA_ENGINEERING_INTELLIGENCE_ARCHITECTURE.md
* KORELUMINA_MASTER_OS.md
* CANONICAL_KNOWLEDGE_MODEL.md
* KR-005_REPOSITORY_KNOWLEDGE_RECOVERY_SPECIFICATION.md
    
