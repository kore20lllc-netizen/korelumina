# KoreLumina Master OS v1

## Mission

KoreLumina is a production-grade AI software operating system for importing, understanding, editing, previewing, deploying, and managing real software projects.

The platform must be built as a long-term system, not as an MVP prototype.

## Core Principle

Builder is the client. Runtime is the source of truth.

No Builder feature may bypass Runtime for project state, AI execution, runtime lifecycle, deployment, diagnostics, authorization, or persistence.

## System Boundaries

### Builder

Responsibilities:
- User interface
- Workspace navigation
- Prompt input
- Diff review
- Preview display
- Runtime status display
- Settings screens
- Diagnostics screens

Builder must not:
- Own business rules
- Store project truth
- Own runtime lifecycle
- Own AI provider logic
- Read/write project files directly except through Runtime APIs

### Runtime

Responsibilities:
- Project registry
- Project metadata
- Runtime process lifecycle
- File system APIs
- Draft generation
- Draft application/revert
- AI orchestration
- Deployment orchestration
- Runtime diagnostics
- Authorization
- Persistence
- Events and telemetry

Runtime is the platform kernel.

## Required Layers

Every production subsystem must follow this shape:

Route
  -> Request Validation
  -> Authentication / Runtime Access
  -> Authorization Policy
  -> Application Service
  -> Domain Service
  -> Repository
  -> Storage Driver

Routes must remain thin.

Routes must not directly:
- Read/write storage
- Implement business rules
- Call AI providers
- Mutate project files without a service layer
- Bypass authorization

## Persistence Strategy

JSON files are transitional only.

Master OS v1 target persistence:

- SQLite for local/runtime development
- PostgreSQL-compatible repository interfaces for future cloud mode
- JSON only for export/import artifacts, not source-of-truth state

Required repository interfaces:
- ProjectRepository
- ProjectMetadataRepository
- RuntimeRepository
- DraftRepository
- AIExecutionRepository
- DeploymentRepository
- AuditLogRepository
- SettingsRepository
- SecretRepository

## Authorization Model

Authorization must be policy based.

Required policy checks:
- canViewProject
- canManageProject
- canDeleteProject
- canRunAI
- canApplyDraft
- canRevertDraft
- canStartRuntime
- canStopRuntime
- canDeployProject
- canViewDiagnostics
- canManageTeam

Runtime caller headers are acceptable only behind trusted Runtime access.

Long-term identity must come from verified auth/session data.

## Runtime Engine

Runtime is an operating system.

Required subsystems:
- Runtime Registry
- Process Manager
- Supervisor
- Recovery Manager
- Workspace Watcher
- Project Scanner
- Metadata Manager
- Event Bus
- Diagnostics Engine
- Resource Monitor

Runtime records must distinguish:
- Managed runtimes started by this process
- Recovered runtimes discovered from persisted state

No fake child processes are allowed.

## AI Engine

AI belongs entirely in Runtime.

Required layers:
- AI Gateway
- AI Request Validator
- Context Builder
- Intent Engine
- Prompt Engine
- Provider Router
- Draft Engine
- Patch Validator
- Audit/Telemetry Recorder

Providers:
- OpenAI
- Anthropic
- Gemini
- Ollama/local
- Mock/rule-based only for development and tests

Builder must never import AI providers.

## Draft Workflow

Target production flow:

Prompt
  -> Runtime draft request
  -> Authorization
  -> Context build
  -> AI execution
  -> Patch validation
  -> Draft persistence
  -> Builder diff review
  -> User approval
  -> Apply selected patches
  -> Audit record
  -> Preview reload

Drafts must support:
- Review before apply
- Per-file approval
- Revert
- Audit trail
- Safe path validation
- No writes outside project root

## Event Model

Runtime events are the source of progress.

Required events:
- runtime:state
- runtime:log
- runtime:error
- runtime:file-changed
- ai:generation-started
- ai:generation-progress
- ai:generation-completed
- ai:generation-failed
- draft:created
- draft:applied
- draft:reverted

Builder should consume events, not poll unnecessarily.

## Production Standards

All new code must include:
- Explicit validation
- Authorization checks
- Structured errors
- Safe filesystem boundaries
- No hardcoded placeholders in production path
- No mock provider fallback in production unless explicitly enabled
- No route-level business logic
- No direct JSON storage access outside repositories
- No silent failures
- Build passing before commit

## Current Reconstruction Priority

1. Lock Master OS v1 architecture.
2. Harden Runtime draft route to production-grade.
3. Verify OpenAI end-to-end draft generation.
4. Implement draft review/apply workflow.
5. Introduce repository/service layer.
6. Replace JSON persistence with SQLite-backed repositories.
7. Add telemetry and audit logs.
8. Add streaming AI progress.

## Non-Negotiables

- Runtime is source of truth.
- Builder is a client.
- Production quality is the default.
- Temporary shortcuts must be labeled and isolated.
- Every subsystem must be extensible without rewrites.
