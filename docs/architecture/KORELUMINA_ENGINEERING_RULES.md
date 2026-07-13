
-------------------------------------------------------------------------------
RECONSTRUCTION GOVERNANCE
-------------------------------------------------------------------------------

Reference

See:

docs/architecture/KORELUMINA_RECONSTRUCTION_RULES.md

This document is the authoritative reconstruction standard for KoreLumina.

All contributors, AI agents, and future reconstruction efforts shall follow
those rules.

The reconstruction rules take precedence over implementation convenience.

Key Principles

• Investigate before modifying code.
• Determine the root cause before implementing a fix.
• One reconstruction ticket equals one architectural responsibility.
• Build after every reconstruction ticket.
• Validate runtime behavior, not only compilation.
• Commit every completed architectural milestone.
• Prevent architectural drift.

Implementation Strategy

PATCH

Use only for localized, non-architectural changes.

FULL FILE REWRITE

Required whenever:

• Public APIs change.
• Contexts or Providers change.
• Domain models change.
• Architectural migrations occur.
• Multiple reconstruction patches have touched the same file.
• Transitional code leaves a file inconsistent.
• A rewrite is clearer than another incremental patch.

Repository Policy

Architectural consistency is a production requirement.

Do not leave partially migrated files in the repository.

When a file becomes architecturally inconsistent:

Stop.

Rewrite the file completely.

Architecture takes precedence over implementation speed.

-------------------------------------------------------------------------------

