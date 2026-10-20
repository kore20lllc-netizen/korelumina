# LR-2026-0020 — Git-track Chief Agent activation records

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: b60464bb..14dab022

Source commits: 14dab022

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-20

Learning cycle: learning-cycle:367ad34208344c0d · written by the Chief Agent (gpt-5.5)

---

## Summary

Chief Agent activation certifications depended on governed runtime-data records that were previously git-ignored and present only on the owner's Mac. Commit 14dab022f1870cd17b2254e975ba07798509ddef tracks the governed records in place and adds a build guard for ignored governed records.

## What changed

- Governed runtime-data records needed by the activation gate were added to git because certifications are re-derived from those records. (`14dab022`, `runtime-data/genesis/conversation-authoritative-completeness-certification/current.json`, `runtime-data/genesis/day-zero-certification/current.json`)
- .gitignore was changed to allow the governed runtime-data records while keeping other runtime-data ignored. (`14dab022`, `.gitignore`)
- The designated runtime replay and its artifacts were tracked for activation replay evidence. (`14dab022`, `runtime-data/genesis/runtime-replay-designation.json`, `runtime-data/genesis/replays/07088856c6038fc0b727252d79851528c275606c86be5d688e0c7e72b796c2dc/execution.json`, `runtime-data/genesis/replays/07088856c6038fc0b727252d79851528c275606c86be5d688e0c7e72b796c2dc/runner-result.json`)
- The designated replay correlation and admission governance evidence were tracked with the replay. (`14dab022`, `runtime-data/genesis/replays/07088856c6038fc0b727252d79851528c275606c86be5d688e0c7e72b796c2dc/admission-governance.json`)
- Acquired conversation records used to re-prove Day-0 coverage were tracked. (`14dab022`, `runtime-data/genesis/conversation-acquisition/latest.json`, `runtime-data/genesis/conversation-acquisition/acquisitions/255c11ccc9949a2a728a6c6ea41655d7f537a744f3332f18baaef3188ce02bb3/record.json`, `runtime-data/genesis/conversation-acquisition/acquisitions/305b0d6b5ef170d3011781a38797a9556fd5ecc6a24c3fb9cff7399fe6b2983e/record.json`)
- npm run build was changed to fail if a governed record would be ignored by git. (`14dab022`, `package.json`)

## Decisions

- The owner decided to commit the governed records instead of leaving activation evidence only on the owner's Mac. (`14dab022`)
- The records were tracked in place through .gitignore exceptions instead of creating a second copy. (`14dab022`, `.gitignore`)
- The change intentionally avoided Runtime code changes. (`14dab022`)
- Other replays, correlations, browser recovery data, and test data were kept ignored. (`14dab022`, `.gitignore`)

## Lessons

- Activation evidence should not depend on files that are ignored by git. (`14dab022`, `.gitignore`)
- Fresh-clone testing was useful because it showed certifications re-derived only when the governed records were present. (`14dab022`)
- A build-time git-ignore guard is needed so newly designated governed replay records are not accidentally omitted. (`14dab022`, `package.json`)
- The runtime suites passed 1569/1569 and left tracked records unchanged after this data-only change. (`14dab022`)

## Open risks

- Future governed records can still be missed if they are not covered by the build-time ignored-record check. (`14dab022`, `package.json`)
- Ignored non-designated replays or correlations will need new .gitignore exceptions if they become governed evidence. (`14dab022`, `.gitignore`)
