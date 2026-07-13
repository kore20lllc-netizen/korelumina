# KoreLumina Reconstruction Rules

Version: 1.0
Status: Active
Applies To:
- All contributors
- All AI agents
- All reconstruction work
- All production engineering changes

---

# Mission

Preserve architectural integrity while reconstructing KoreLumina.

Every reconstruction task must improve the codebase without introducing
architectural drift.

Correctness takes precedence over speed.

---

# Reconstruction Workflow

Every ticket follows exactly this sequence.

1. Investigate
2. Determine Root Cause
3. Select Implementation Strategy
4. Implement
5. Build
6. Validate
7. Commit
8. Continue

Never skip investigation.

Never patch speculative problems.

Never implement multiple architectural changes in one ticket.

---

# Implementation Strategy Decision Matrix

Always choose the smallest safe implementation.

## PATCH

Use a patch ONLY when ALL conditions are true.

• Approximately 20% or less of the file changes.
• No public API modifications.
• No architectural redesign.
• No domain model migration.
• No Context or Provider redesign.
• File remains internally consistent.
• First reconstruction affecting the file.

Typical examples

- Import fixes
- Bug fixes
- Wiring
- Typing corrections
- Small logic changes
- Dependency updates

---

## FULL FILE REWRITE

Rewrite the complete file whenever ANY condition is true.

• Public API changes.
• Context redesign.
• Provider redesign.
• Domain model migration.
• Architectural restructuring.
• Multiple reconstruction patches already touched the file.
• Transitional code has left the file inconsistent.
• Incremental patching increases complexity.
• Full replacement is clearer than another patch.

A full rewrite is preferred over repeated incremental patches once a file
crosses the architectural migration threshold.

---

# Architectural Rules

One reconstruction ticket equals one architectural responsibility.

Do not mix:

- UI redesign
- State redesign
- Context redesign
- Persistence
- Styling
- Runtime integration

into the same ticket.

Complete one responsibility before starting the next.

---

# State Management Rules

UI components never own domain state.

UI components consume:

- Models
- Actions
- Selectors

Domain state is owned by Providers.

Business logic belongs in Actions.

Derived values belong in Selectors.

Rendering belongs in Resolvers.

---

# Context Rules

Contexts expose stable public APIs.

Do not expose implementation details.

Preferred pattern:

{
    state,
    actions,
    selectors
}

Avoid exposing setters unless they are intentionally public.

---

# Domain Model Rules

Models describe the canonical state.

Models never contain UI-only concepts.

Example

Correct

blur: number

Incorrect

blurMode: "heavy"

UI presets must resolve into canonical model values.

---

# Resolver Rules

Rendering logic is isolated.

Model

↓

Resolver

↓

CSS Variables

↓

Components

Components never manipulate CSS variables directly.

---

# Investigation Rules

Always investigate before modifying code.

Determine:

- Root cause
- Scope
- Architectural impact
- Existing ownership

Never fix symptoms without identifying the cause.

---

# Validation Rules

Every reconstruction ticket must finish with:

Build

Validation

Runtime verification

If applicable:

- UI verification
- Runtime verification
- API verification
- Preview verification

Green build alone is insufficient.

---

# Commit Rules

Commit only after:

✓ Build succeeds

✓ Validation succeeds

✓ Runtime behavior verified

Commit messages describe architectural intent.

Example

refactor(appearance): migrate GlassCard to action-based appearance engine

---

# Anti-Patterns

Do not:

• Layer patches indefinitely.
• Introduce duplicate state.
• Leave transitional APIs public.
• Mix old and new architectures.
• Introduce architectural drift.
• Perform speculative rewrites.
• Leave partially migrated files.

When architectural inconsistency appears:

Stop.

Rewrite the file.

---

# Architectural Decision Record

ADR-017

Title

Full File Reconstruction Strategy

Decision

Architectural migrations use complete file replacement rather than repeated
incremental patches.

Rationale

• Prevents architectural drift.
• Eliminates partially migrated state.
• Produces clearer history.
• Simplifies review.
• Improves recovery.
• Improves AI-assisted engineering.
• Reduces reconstruction time.

Consequences

Large architectural migrations become deterministic.

Incremental patching is reserved for localized changes only.

This rule applies project-wide.

---

# Engineering Principle

Every reconstruction should leave the codebase in a cleaner architectural
state than it was found.

Architecture first.

Correctness second.

Features third.

Never sacrifice the first two for the third.


-------------------------------------------------------------------------------
RECONSTRUCTION TOOLING STANDARD
-------------------------------------------------------------------------------

Status

Production Requirement

The reconstruction workflow shall use standardized engineering tooling.

Temporary utilities located in /tmp are prohibited except for local debugging.

-------------------------------------------------------------------------------
PATCH TOOL
-------------------------------------------------------------------------------

Canonical Location

tools/reconstruction/patch.py

Purpose

Apply localized reconstruction patches safely.

Requirements

• Validate patch context before modification.
• Fail without modifying files if context differs.
• Support multiple hunks.
• Preserve formatting.
• Never partially apply a failed patch.
• Return non-zero exit code on failure.

Usage

python tools/reconstruction/patch.py <file> <<'PATCH'
...
PATCH

Do not use temporary patch utilities stored under /tmp.

-------------------------------------------------------------------------------
FILE REPLACEMENT
-------------------------------------------------------------------------------

Full file rewrites shall use:

cat > <path> <<'EOF'
...

-------------------------------------------------------------------------------
RECONSTRUCTION TOOLING STANDARD
-------------------------------------------------------------------------------

Status

Production Requirement

The reconstruction workflow shall use standardized engineering tooling.

Temporary utilities located in /tmp are prohibited except for local debugging.

-------------------------------------------------------------------------------
PATCH TOOL
-------------------------------------------------------------------------------

Canonical Location

tools/reconstruction/patch.py

Purpose

Apply localized reconstruction patches safely.

Requirements

• Validate patch context before modification.
• Fail without modifying files if context differs.
• Support multiple hunks.
• Preserve formatting.
• Never partially apply a failed patch.
• Return non-zero exit code on failure.

Usage

python tools/reconstruction/patch.py <file> <<'PATCH'
...
PATCH

Do not use temporary patch utilities stored under /tmp.

-------------------------------------------------------------------------------
FILE REPLACEMENT
-------------------------------------------------------------------------------

Full file rewrites shall use:

cat > <path> <<'EOF'
...

-------------------------------------------------------------------------------
RECONSTRUCTION TOOLING STANDARD
-------------------------------------------------------------------------------

Status

Production Requirement

The reconstruction workflow shall use standardized engineering tooling.

Temporary utilities located in /tmp are prohibited except for local debugging.

-------------------------------------------------------------------------------
PATCH TOOL
-------------------------------------------------------------------------------

Canonical Location

tools/reconstruction/patch.py

Purpose

Apply localized reconstruction patches safely.

Requirements

• Validate patch context before modification.
• Fail without modifying files if context differs.
• Support multiple hunks.
• Preserve formatting.
• Never partially apply a failed patch.
• Return non-zero exit code on failure.

Usage

python tools/reconstruction/patch.py <file> <<'PATCH'
...
PATCH

Do not use temporary patch utilities stored under /tmp.

-------------------------------------------------------------------------------
FILE REPLACEMENT
-------------------------------------------------------------------------------

Full file rewrites shall use a heredoc with a delimiter that does not appear
inside the document.

Example

cat > <path> <<'FILE_CONTENT'
...
FILE_CONTENT

Never use "EOF" as the outer delimiter if the document itself contains "EOF"
examples.

Never perform manual editing for architectural reconstruction.

-------------------------------------------------------------------------------
RECONSTRUCTION INSPECTION
-------------------------------------------------------------------------------

Repository investigations shall use standardized inspection tooling.

Canonical Location

tools/reconstruction/inspect.sh

Purpose

Provide deterministic repository inspection commands including:

• Architecture inventory
• Dependency inspection
• Import graph inspection
• Runtime inspection
• UI inspection
• Duplicate implementation detection
• Placeholder detection
• Technical debt discovery

Investigation always precedes implementation.

-------------------------------------------------------------------------------
WORKFLOW
-------------------------------------------------------------------------------

Every reconstruction ticket follows this sequence.

1. inspect.sh
2. Root Cause Analysis
3. Implementation Strategy
4. patch.py OR cat > FILE_CONTENT
5. Build
6. Runtime Validation
7. Commit
8. Push

-------------------------------------------------------------------------------
PATCH STRATEGY
-------------------------------------------------------------------------------

Use patch.py only when ALL are true.

• Localized modification.
• Public API unchanged.
• Approximately 20% or less of file changes.
• File remains architecturally consistent.

Otherwise:

Rewrite the complete file.

-------------------------------------------------------------------------------
ENGINEERING PHILOSOPHY
-------------------------------------------------------------------------------

Reconstruction tooling is part of the KoreLumina architecture.

Engineering tools shall be:

• Version controlled.
• Production quality.
• Deterministic.
• Reusable.
• Repository owned.

Do not depend on ephemeral session-specific utilities.

