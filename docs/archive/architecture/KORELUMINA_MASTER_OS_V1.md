# KoreLumina Master OS v1

## Mission

KoreLumina is a production-grade software operating system for AI-native teams.

The landing page is the product contract. Every public claim must map to a real subsystem, entitlement, workflow, or launch blocker.

## Core Principle

Builder is the client. Runtime is the source of truth.

No Builder feature may bypass Runtime for project state, AI execution, runtime lifecycle, deployment, diagnostics, authorization, transformation, audit, billing, or persistence.

## Platform Domains

KoreLumina is organized into four domains:

1. Public Platform
2. Runtime Infrastructure
3. Internal Engineering Platform
4. Shared Platform Services

## Public Platform Contract

The Public Platform contains customer-facing capabilities promised on the landing page.

### Repository Import

Promise:
- Import existing repositories.
- Work with real-world codebases, not only blank templates.

Owning systems:
- Repository Import Service
- Project Registry
- Runtime Project Scanner
- Project Metadata Service

Status requirement:
- Imported projects must appear in Dashboard.
- Runtime must recognize imported projects.
- Project ownership and metadata must be persisted.
- Imported projects must be previewable or report clear unsupported-framework errors.

### AI Builder

Promise:
- Build with AI.
- Generate, repair, transform, and evolve software from the workspace.

Owning systems:
- AI Workspace
- Runtime AI Gateway
- AI Orchestrator
- Context Builder
- Draft Engine
- Patch Validator
- Apply/Revert Engine

Status requirement:
- AI must create reviewable drafts.
- No direct writes without approval.
- Apply must be reversible.
- AI provider execution must be observable.
- Mock providers must not run in production unless explicitly enabled.

### Transform App → Website

Promise:
- Public customer feature.
- Free users can unlock one project for a one-time payment.
- Pro and above include Transform App → Website.
- Imported applications can be transformed into production-ready websites.

Owning systems:
- Public Transformation Workflow
- Transform Entitlement Service
- Runtime File Writer
- Draft Engine
- Designer Workspace
- Developer Workspace
- Usage/Billing Service

Important boundary:
- This is not the same as mobile packaging.
- This is a public product workflow.
- It must be available through customer-facing Builder workflows.

Status requirement:
- Feature gating must match pricing.
- $49 one-time unlock must be tracked.
- Transform output must be persisted to Runtime projects.
- Transform must generate reviewable files or drafts.
- Transform usage must be recorded.

### Repo Audit Engine

Promise:
- Import any repository.
- Understand what is broken.
- Analyze dependencies, build failures, type errors, environment requirements, security issues, and architecture risks.
- Generate a repair plan.
- Apply fixes from the plan.

Access model:
- Available on Business and Enterprise plans.
- Available with active in-house developer engagement.
- Not a free self-serve feature.

Owning systems:
- Repo Audit Workspace
- Audit Engine
- Dependency Analyzer
- Build Analyzer
- Type/Error Analyzer
- Environment Analyzer
- Security Analyzer
- Repair Plan Generator
- Fix Draft Engine
- Audit PDF/Report Generator

Status requirement:
- `repoAudit` capability must gate access.
- Disabled UI must route users to sales/unlock.
- Reports must be reproducible.
- Repair plans must be reviewable before fixes are applied.
- Fix application must use the Draft Engine and safe filesystem boundaries.

### Runtime Preview

Promise:
- Live runtime orchestration.
- Preview projects from a single platform.
- Support desktop, tablet, and mobile preview sizing.

Owning systems:
- Runtime Manager
- Preview Engine
- Runtime Registry
- Workspace Watcher
- Runtime Event Bus
- PreviewFrame

Status requirement:
- Selecting a project starts or resolves runtime.
- Preview URL must come from Runtime.
- File changes must trigger preview refresh.
- Runtime errors must surface clearly.

### Deployment and Infrastructure Freedom

Promise:
- Use KoreLumina-managed infrastructure.
- Bring your own stack.
- Connect Supabase, GitHub, Vercel, and deployment pipelines.
- Keep deployment paths portable.

Owning systems:
- Deployment Engine
- Managed Infrastructure Service
- BYO Provider Integrations
- Secrets Service
- Domain/SSL Service
- Deployment Registry

Status requirement:
- Managed deployment must be explicit.
- BYO deployment must be explicit.
- Secrets must never live in Builder state.
- Provider keys must be stored securely.
- Deployment ownership must remain with the customer when BYO is used.

### Ownership and Portability

Promise:
- KoreLumina helps operate customer software but never owns it.
- Customers own repositories, infrastructure, deployment pipeline, databases, AI providers, data, IP, and customer relationships.

Owning systems:
- Project Ownership Service
- Metadata Repository
- Export Service
- BYO Integrations
- Secrets Service
- Billing/Subscription Service

Status requirement:
- Project ownership must be explicit.
- Transfer of ownership must be auditable.
- Export paths must exist.
- BYO provider connections must preserve customer control.

### Templates Marketplace

Promise:
- Production-ready starters across websites, web apps, dashboards, AI tools, and mobile app templates.
- Starters are customizable and ready to fork.

Owning systems:
- Template Marketplace
- Template Registry
- Project Scaffold Service
- Import/Create Project Workflow

Status requirement:
- Templates must create real Runtime projects.
- Templates must not be mock-only artifacts.
- Template categories must match public claims.

### BYO API Keys

Promise:
- Users can connect OpenAI, Anthropic, or Google AI keys.
- BYO key users pay providers directly.
- KoreLumina subscription still covers platform access and orchestration.

Owning systems:
- AI Provider Registry
- Secrets Service
- Billing Service
- Usage Metering
- AI Execution Repository

Status requirement:
- Keys must be encrypted at rest.
- Builder must never expose secrets after save.
- AI execution must record provider source: platform key or BYO key.
- Billing must distinguish included credits, overage, and BYO usage.

### AI Usage Billing

Promise:
- Paid plans include AI credits.
- Overage is billed transparently.
- BYO API key users pay providers directly.

Owning systems:
- Usage Metering
- Billing Engine
- AI Execution Repository
- Subscription Entitlement Service

Status requirement:
- Every AI execution must be recorded.
- Token/cost metadata must be available where provider supports it.
- Entitlements must block or bill usage correctly.

### Enterprise Governance

Promise:
- Enterprise governance is built in.
- Security, compliance, auditability, deployment governance, infrastructure control, and enterprise support.

Owning systems:
- Authorization Service
- Policy Engine
- Audit Log Service
- Team/Workspace Service
- Deployment Governance
- Enterprise Support Workflows
- Diagnostics

Status requirement:
- RBAC must be policy-based.
- Admin/support actions must be audited.
- Enterprise-only features must be gated.
- Diagnostics must be available to authorized roles only.

### In-House Developer Escalation

Promise:
- AI handles routine work.
- Complex work escalates to KoreLumina engineers.
- Services include quick fixes, feature sprints, modernization projects, dedicated development, enterprise transformation, repo audit, white-glove repair, and mobile app packaging.

Owning systems:
- In-House Dev Console
- Sales Request Workflow
- Engagement Registry
- Internal Engineering Platform
- Audit Engine
- Mobile Packaging Workflow
- Admin/Support Access

Status requirement:
- Escalation must not be confused with self-serve AI.
- In-house tooling must be restricted to authorized KoreLumina roles.
- Customer-facing UI should request or unlock service, not expose internal controls.

### Mobile App Packaging

Promise:
- In-house developer service.
- Convert a KoreLumina web app into production-ready iOS and Android applications using Capacitor.
- Includes native project setup, app icons, splash screens, native plugin setup, and store-ready builds.

Access model:
- Internal/In-House Dev only.
- Sold as a service, not public self-serve tooling.

Owning systems:
- In-House Dev Console
- Mobile Packaging Card
- Capacitor Packaging Service
- Native Build Workflow
- Release Artifact Service

Status requirement:
- Customer should not access raw internal mobile packaging controls.
- In-house developers can initialize Capacitor, sync, open iOS/Android, and build mobile bundles.
- Store-ready output must be tracked as deliverables.

## Autonomous Operations Layer

The Autonomous Operations Layer is KoreLumina's internal self-healing and operational control layer.

It is not a public AI agent promise. It exists to make the platform observable, diagnosable, recoverable, and eventually self-correcting.

### AOL Modules

Required modules:
- Health Engine
- Diagnostics Engine
- Root Cause Engine
- Repair Engine
- Validation Engine
- Recovery Engine
- Policy Engine
- Audit Engine

### AOL Incident Flow

Operational incidents must follow this flow:

Incident
  -> Diagnosis
  -> Repair
  -> Verification
  -> Outcome

### AOL Long-Term Goal Flow

Future autonomous operations must follow this flow:

Goal
  -> Plan
  -> Implementation
  -> Validation
  -> Deployment

### AOL Boundary

AOL may recommend, plan, validate, and recover.

AOL must not silently mutate customer projects or infrastructure without policy approval, audit logging, and rollback support.

## Runtime Infrastructure

Runtime is the platform kernel.

Responsibilities:
- Project lifecycle
- Project registry
- Project metadata
- Filesystem APIs
- Runtime process lifecycle
- Preview orchestration
- Workspace watching
- Draft persistence
- Draft application/revert
- Runtime diagnostics
- Runtime events
- Runtime authorization
- Runtime persistence

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

## Internal Engineering Platform

The Internal Engineering Platform powers KoreLumina engineering operations and premium service delivery.

These systems are proprietary and are not public APIs.

### Engineering Audit Engine

Purpose:
- Understand existing software and generate technical assessment.

Responsibilities:
- Repository analysis
- Architecture discovery
- Dependency analysis
- Build verification
- Type/error analysis
- Environment detection
- Security review
- Technical debt analysis
- Runtime compatibility
- Modernization recommendations
- Repair plan generation

Boundary:
- The Audit Engine may produce reports, repair plans, and draftable fixes.
- It must not silently mutate customer code.

### Capacitor Packaging Service

Purpose:
- Package eligible KoreLumina web applications as native iOS and Android apps for in-house engagements.

Boundary:
- Internal only.
- Not a public SDK.
- Not exposed as direct customer self-service.

Responsibilities:
- Capacitor initialization
- Native project generation
- Native plugin setup
- App icon and splash screen management
- iOS project preparation
- Android project preparation
- Store-ready build bundle preparation
- Internal logs and status reporting

### Modernization and Repair Workflows

Purpose:
- Support engineer-led repair, modernization, and transformation engagements.

Responsibilities:
- Consume audit reports
- Create repair plans
- Generate draft patches
- Coordinate AI and human review
- Track deliverables
- Produce customer-ready outcomes

## Shared Platform Services

Shared services are used by Public Platform, Runtime Infrastructure, and Internal Engineering Platform.

Required services:
- Identity
- Teams
- Workspaces
- Authorization
- Policy Engine
- Billing
- Entitlements
- Usage Metering
- Secrets
- Configuration
- Audit Logs
- Notifications
- Event Bus
- Telemetry
- Feature Flags

## Required Layers

Every production subsystem must follow this shape:

Route
  -> Request Validation
  -> Runtime Access / Authentication
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
- Bypass entitlement checks

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
- BillingRepository
- EntitlementRepository
- TemplateRepository
- EngagementRepository

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
- canRunRepoAudit
- canUseTransformAppToWebsite
- canUseBYOProvider
- canManageTeam
- canAccessInHouseDev
- canUseMobilePackaging

Runtime caller headers are acceptable only behind trusted Runtime access.

Long-term identity must come from verified auth/session data.

## Repo Intelligence and Cost Control Pipeline

KoreLumina must not blindly send repositories to expensive models.

Every repository-driven AI workflow must pass through intelligence, complexity, cost, budget, and routing layers before execution.

Required pipeline:

Repository
  -> Repo Intelligence Engine
  -> Complexity Classifier
  -> Cost Estimator
  -> Budget Manager
  -> Model Router
  -> Repo Audit Engine
  -> Repair Planner
  -> Transformation Engine
  -> Universal Runtime
  -> Deployment

### Repo Intelligence Engine

Responsibilities:
- Repository structure analysis
- Framework detection
- Dependency graph generation
- Entrypoint discovery
- Risk identification
- Runtime compatibility classification
- AI context preparation

### Complexity Classifier

Responsibilities:
- Classify project complexity before AI execution
- Estimate workflow size and risk
- Determine whether work is routine, advanced, enterprise, or in-house assisted
- Block unsupported workflows before cost is incurred

### Cost Estimator

Responsibilities:
- Estimate token usage
- Estimate provider cost
- Estimate execution time
- Estimate required credits
- Surface expected cost before expensive operations

### Budget Manager

Responsibilities:
- Enforce execution limits
- Enforce monthly AI credits
- Enforce team pools
- Enforce one-time add-ons
- Enforce top-ups
- Enforce enterprise custom limits
- Stop or downgrade workflows before budget violations

### Model Router

Responsibilities:
- Route workloads to the correct provider/model
- Support platform keys
- Support BYO API keys
- Support BYO models for Enterprise
- Support private inference routing for Enterprise
- Prefer lower-cost models when acceptable
- Escalate to stronger models only when complexity requires it

### Plan Entitlement Model

Free:
- Fixed execution count

Pro:
- Monthly AI credits
- BYO API keys
- Credit top-ups

Business:
- Larger AI credits
- BYO API keys
- Team credit pools

Enterprise:
- Custom limits
- BYO models
- Private deployments
- Dedicated inference routing

## AI Engine

AI belongs in Runtime.

Required layers:
- AI Gateway
- AI Request Validator
- Context Builder
- Intent Engine
- Prompt Engine
- Provider Router
- Provider Adapter
- Draft Engine
- Patch Validator
- Audit/Telemetry Recorder

Providers:
- OpenAI
- Anthropic
- Gemini / Google AI
- Ollama/local
- Mock/rule-based only for development and tests

Builder must never import AI providers.

## Draft Workflow

Target production flow:

Prompt
  -> Runtime draft request
  -> Authorization
  -> Entitlement check
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
- audit:started
- audit:completed
- audit:failed
- transform:started
- transform:completed
- transform:failed
- mobile-packaging:started
- mobile-packaging:completed
- mobile-packaging:failed

Builder should consume events, not poll unnecessarily.

## Production Standards

All new code must include:
- Explicit validation
- Authorization checks
- Entitlement checks
- Structured errors
- Safe filesystem boundaries
- No hardcoded placeholders in production path
- No mock provider fallback in production unless explicitly enabled
- No route-level business logic
- No direct JSON storage access outside repositories
- No silent failures
- Observable runtime behavior
- Build passing before commit

## Launch Contract Checklist

Before launch, every landing page promise must be either:

1. Implemented and production-ready
2. Properly feature-gated
3. Clearly marked as sales-assisted or in-house service
4. Removed from public marketing

Current public promises that must remain tracked:
- Existing repository import
- AI Builder
- Runtime preview
- Transform App → Website
- Repo Audit Engine
- Templates Marketplace
- Managed infrastructure
- BYO infrastructure
- BYO API keys
- AI usage billing
- Ownership and portability
- Enterprise governance
- In-house developer escalation
- Mobile app packaging as in-house service

## Current Reconstruction Priority

1. Lock Master OS v1 architecture against landing contract.
2. Harden Runtime draft route to production-grade.
3. Verify OpenAI end-to-end draft generation.
4. Implement draft review/apply workflow.
5. Introduce repository/service layer.
6. Replace JSON persistence with SQLite-backed repositories.
7. Add telemetry and audit logs.
8. Add streaming AI progress.
9. Bring Transform App → Website under Runtime/service ownership.
10. Bring Repo Audit under service/repository ownership.

## Non-Negotiables

- Landing page is the product contract.
- Runtime is source of truth.
- Builder is a client.
- Production quality is the default.
- Temporary shortcuts must be labeled and isolated.
- Every subsystem must be extensible without rewrites.
- Public features and internal engineering tools must remain clearly separated.
