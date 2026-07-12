# KoreLumina Reconstruction Engine

Architectural Owner: Platform Infrastructure

Status: Active

The Reconstruction Engine provides the repository-owned workflow for safe,
deterministic production modifications.

## Canonical Workflow

Architecture

↓

Capability Ownership

↓

Investigation

↓

Implementation Strategy

↓

Patch or Full File Rewrite

↓

Production Build

↓

Runtime Validation

↓

Knowledge Extraction

↓

Commit

↓

Push

## Inspection

Use:

- tools/reconstruction/inspect.sh architecture
- tools/reconstruction/inspect.sh runtime
- tools/reconstruction/inspect.sh workspace runtime
- tools/reconstruction/inspect.sh imports <path>
- tools/reconstruction/inspect.sh placeholders <path>
- tools/reconstruction/inspect.sh duplicates <path>
- tools/reconstruction/inspect.sh status

Investigation always precedes implementation.

## Localized Changes

Use:

    python tools/reconstruction/patch.py --check patch.diff

then

    python tools/reconstruction/patch.py patch.diff

The patch tool validates the complete patch before modifying the repository.

## Full File Reconstruction

Use quoted heredocs with descriptive delimiters.

Example:

    cat > path/to/file.ts <<'END_TYPESCRIPT'
    ...
    END_TYPESCRIPT

Avoid generic delimiters like EOF when the document itself contains heredoc
examples.

## Validation

Run:

    python tools/reconstruction/validate_patch.py

Validation includes:

- Git whitespace verification
- Conflict marker detection
- Repository build
- Git status inspection

Green compilation alone is insufficient.

## Checkpoint Policy

Every completed reconstruction ticket ends with:

- Build
- Validation
- Commit
- Push

Do not stack architectural migrations without a recovery checkpoint.

## Engineering Philosophy

The reconstruction toolchain is part of the KoreLumina platform.

Engineering tooling must be:

- Repository owned
- Version controlled
- Deterministic
- Reusable
- Production quality

Do not depend on temporary tooling under /tmp.
