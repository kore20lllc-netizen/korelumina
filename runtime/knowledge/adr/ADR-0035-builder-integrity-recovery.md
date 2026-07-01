# ADR-0035 — Builder Integrity Recovery

## Status

Accepted

## Context

During Platform SDK extraction, the Builder failed to build because several
tracked repository artifacts had been removed.

Examples included:

- EntryView.tsx
- DevAIAssistPanel.tsx
- lumina.webp

Each failure appeared as an architecture problem but was actually caused by
missing tracked repository contents.

## Decision

Repository integrity was restored by recovering tracked artifacts from the
last known good commit instead of creating replacement implementations.

Recovery process:

1. Build until the first ENOENT.
2. Verify the file is referenced.
3. Verify the file exists in Git history.
4. Restore the tracked artifact.
5. Repeat until the repository builds successfully.

No placeholder components or substitute assets were introduced.

## Validation

### Platform SDK

- Build: PASS

### Runtime

- Build: PASS

### Builder

- Production build: PASS

## Engineering Rule

Missing tracked files are repository integrity issues.

They are not architectural opportunities.

When a tracked file is missing:

- Restore it from Git history.
- Do not recreate it manually.
- Do not replace it with placeholder implementations.
- Resume architecture work only after repository integrity has been restored.

## Outcome

Platform SDK consolidation was validated.

The Runtime architecture remained correct.

The Builder architecture remained correct.

The only regressions encountered were incomplete repository contents.

This recovery procedure becomes the standard workflow for future architectural reconstruction efforts.
