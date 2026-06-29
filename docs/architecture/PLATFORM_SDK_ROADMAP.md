# Platform SDK Roadmap

Status: Active

Owner: Platform Architecture

Purpose:

Define the extraction roadmap for shared infrastructure that belongs in
@korelumina/platform-sdk.

---

## Completed

### Repository Discovery

Owner:
- packages/platform-sdk/src/paths/RepositoryPaths.ts

Capabilities:
- findUpward()
- getRepoRoot()
- getProjectsRoot()

---

### Filesystem Safety

Owner:
- packages/platform-sdk/src/paths/RepositoryPaths.ts

Capabilities:
- assertSafeProjectId()
- ensureWithinRoot()
- resolveProjectPath()

---

### Process Execution

Owner:
- packages/platform-sdk/src/process

Capabilities:
- runCommand()
- runCommandSync()

---

## Deferred

### Knowledge Paths

Current Owner:
- apps/lumina-runtime/src/projects/knowledgePaths.ts

Decision:
- Deferred.

Reason:
- Current consumers are runtime-only.
- Extraction becomes valid only when reused outside Runtime.

---

## Ready For Investigation

### Provider Registry Infrastructure

Reason:
- Multiple knowledge provider registries appear to duplicate mechanics.

Candidates:
- ReasoningProviderRegistry
- PlanningProviderRegistry
- ExecutionProviderRegistry
- LearningProviderRegistry
- SearchProviderRegistry
- EngineerAgentProviderRegistry
- OrganizationalMemoryProviderRegistry
- AutonomousImprovementProviderRegistry

Target:
- Generic ProviderRegistry<T>

---

### Configuration

Reason:
- Runtime and Builder both maintain configuration concerns.

Target:
- packages/platform-sdk/src/configuration

---

### Diagnostics

Reason:
- Runtime diagnostics and system health should share common reporting contracts.

Target:
- packages/platform-sdk/src/diagnostics

---

### Environment

Reason:
- Runtime, Builder, and future packages need consistent environment access.

Target:
- packages/platform-sdk/src/environment

---

### Workspace APIs

Reason:
- Workspace path and project infrastructure are shared platform concerns.

Target:
- packages/platform-sdk/src/workspace

---

## Not Platform SDK

### Runtime Lifecycle

Owner:
- apps/lumina-runtime

Reason:
- Runtime owns process lifecycle, supervision, preview orchestration, registry,
  watcher, and recovery.

---

### Builder UI

Owner:
- apps/lumina-builder

Reason:
- Builder owns presentation, workspace UI, editor UX, preview presentation, and
  user interaction.

---

## Rule

A capability moves to Platform SDK only when it is reusable infrastructure and
has or reasonably will have more than one consumer.

Runtime-specific orchestration remains in Runtime.

Builder-specific presentation remains in Builder.

