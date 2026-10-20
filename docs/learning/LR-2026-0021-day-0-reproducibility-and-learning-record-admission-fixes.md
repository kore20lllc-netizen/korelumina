# LR-2026-0021 — Day-0 reproducibility and Learning Record admission fixes

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 14dab022..fb3556db

Source commits: e1cdb630, fb3556db

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-20

Learning cycle: learning-cycle:b6478f8eff6e70bb · written by the Chief Agent (gpt-5.5)

---

## Summary

Day-0 browser recovery coverage was re-derived from the configured conversation source and the recovery data was committed so a fresh clone can reproduce activation prerequisites when the required variable is set and ADR-0045 is applied. Source: e1cdb630cff6a653fc319783929a556c93ed09c0. Education admission was changed so Learning Records remain canonical knowledge rather than Day-0 curriculum, restoring valid certifications without re-certification. Source: fb3556db36545c69e4b055c844d282587dd0c115.

## What changed

- Browser recovery Day-0 coverage was re-derived from KORELUMINA_GENESIS_CHATGPT_BROWSER_RECOVERY_ROOT because the absent folder made the acquisition inventory differ and Day-0 read stale. (`e1cdb630`)
- The browser recovery registry was added under runtime-data/genesis/chatgpt-browser-recovery/project-registry.json. (`runtime-data/genesis/chatgpt-browser-recovery/project-registry.json`, `e1cdb630`)
- Browser recovery acquisition inventories were added under runtime-data/genesis/chatgpt-browser-recovery/project-inventories/project-g-p-69cbc434281c8191a10f1c7b3ffe11a9.json. (`runtime-data/genesis/chatgpt-browser-recovery/project-inventories/project-g-p-69cbc434281c8191a10f1c7b3ffe11a9.json`, `e1cdb630`)
- Browser recovery conversation snapshots were added under runtime-data/genesis/chatgpt-browser-recovery/snapshots/conversation-69760457-b00c-832b-8d81-384ee5032859.json. (`runtime-data/genesis/chatgpt-browser-recovery/snapshots/conversation-69760457-b00c-832b-8d81-384ee5032859.json`, `e1cdb630`)
- .gitignore was updated to document the variable a fresh clone sets for browser recovery Day-0 reproduction. (`.gitignore`, `e1cdb630`)
- Educational admission policy was changed so education no longer admits authority class learning. (`apps/lumina-runtime/src/knowledge-education/admission/EducationalAdmissionPolicy.ts`, `fb3556db`)
- A test was added for Learning Record educational admission behavior. (`apps/lumina-runtime/src/knowledge-education/__tests__/EducationalAdmissionLearningRecords.test.ts`, `fb3556db`)
- ADR-0045 was added to record that Learning Records are knowledge, not curriculum. (`docs/adr/ADR-0045-learning-records-are-knowledge-not-curriculum.md`, `fb3556db`)

## Decisions

- The owner decided to commit the browser recovery conversations. (`e1cdb630`)
- ADR-0045 decided that Learning Records are canonical knowledge and should reach reasoning through canonical knowledge rather than through the Day-0 curriculum. (`docs/adr/ADR-0045-learning-records-are-knowledge-not-curriculum.md`, `fb3556db`)
- The education fix avoided re-certification by validating every certification against the exact candidate the owner certified on 2026-10-17. (`fb3556db`)

## Lessons

- A Day-0 proof run without the configured browser recovery source missed required acquisition data. (`e1cdb630`)
- Leaving the browser recovery folder absent made a fresh clone unable to reproduce this machine. (`e1cdb630`)
- Admitting Learning Records into the Day-0 curriculum caused the corpus candidate to go incomplete because the records lacked an educational authority resolution. (`fb3556db`)
- After Learning Records were excluded from education admission, the runtime suites reported 1571/1571. (`fb3556db`)

## Open risks

- Fresh clone activation validity depends on setting KORELUMINA_GENESIS_CHATGPT_BROWSER_RECOVERY_ROOT and applying ADR-0045. (`e1cdb630`)
