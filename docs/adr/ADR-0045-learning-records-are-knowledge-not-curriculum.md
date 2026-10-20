# ADR-0045 — Learning Records are knowledge, not curriculum

## Status

Accepted

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: Whether canonical Learning Records (ADR-0042) enter the Day-0 educational curriculum that the Chief Agent's activation prerequisites certify (ADR-0041). Amends how ADR-0042's authority class `learning` is treated by knowledge education; changes nothing about how Learning Records are written, promoted, revoked or used in reasoning.

---

## Context

- **Activation rests on a chain of certifications** (ADR-0041): Day-0 Genesis, the educational corpus, initial competency, the owner's human acceptance, and the production workspace authorization. Each is re-derived from current state whenever it is read and is valid only while the derived candidate matches the one the owner certified (2026-10-17).
- **The educational corpus is built from every educationally admissible canonical item.** Each must have an educational authority resolution; one without becomes an `educational-source-authority-unresolved` exception, the corpus candidate is incomplete, and every certification after it reads BLOCKED.
- **Continuous learning makes a Learning Record canonical after owner commits** (ADR-0042), under authority class `learning`, its own review policy, and subordinate to Canon, Constitution, Blueprint, governance, business and domain knowledge.
- **Observed on 2026-10-20:** 13 canonical Learning Records (LR-2026-0001 to 0013) were admitted to the curriculum without authority resolutions. The corpus, initial competency, human acceptance and workspace authorization all read BLOCKED. The activation gate stayed ACTIVE only because ADR-0041 does not suspend on drift. Re-certifying would last until the next Learning Record, that is, the next owner commit.
- **Tested:** with Learning Records kept out of the curriculum, every certification reads VALID against the exact candidate the owner certified, with no re-certification.
- The Chief Agent reasons with Learning Records through canonical knowledge (KA-1), not through the education curriculum.

## Problem

Keep the certified foundation stable while continuous learning keeps adding canonical knowledge, without weakening either: the curriculum must not silently absorb unreviewed sources, and Learning Records must keep reaching the Chief Agent's reasoning.

## Options

1. **Resolve each Learning Record's educational authority and re-certify the chain after each one.** Rejected: five certifications to renew after every owner commit turns a governance act into a rubber stamp.
2. **Admit them as curriculum and list them as excluded material.** Rejected: the excluded list is part of the corpus identity, so every new record still changes the candidate and the chain still goes stale.
3. **Learning Records are knowledge, not curriculum: education does not admit authority class `learning`.** Chosen.

## Decision

1. **Knowledge education does not admit canonical items of authority class `learning`.** They are not curriculum artifacts, need no educational authority resolution, and do not change the educational corpus, the competency assessment or the education view.
2. **Learning Records stay canonical knowledge.** Their writing, checks, review policy, promotion, revocation and use in Chief Agent reasoning are unchanged (ADR-0042, KA-1).
3. **The curriculum changes only through its own sources.** Curriculum drift (ADR-0041) now means a change to foundational knowledge, which the owner re-certifies on their own schedule.

## Consequences

- The certifications of 2026-10-17 are valid again without re-certification, and stay valid across owner commits.
- A Learning Record can never become part of what the owner certified as the Chief Agent's foundation; to make a lesson foundational, it is written into a foundational document through the normal canonical process.
- Knowledge Operations' education view no longer lists Learning Records as curriculum artifacts.

## Implementation Impact

- `isEducationallyAdmissible` refuses authority class `learning` (ADR-0045 ticket, with tests).

## Validation

- A canonical Learning Record is not educationally admissible; foundational canonical items still are.
- Adding Learning Records does not change the education snapshot.
- On the owner's records, Day-0, educational corpus, initial competency, human acceptance and workspace authorization read VALID against their certified candidates, and the activation gate reports all five prerequisites VALID.
- Runtime suites pass.

## Related Tickets

ADR-0045. Builds on ADR-0041, ADR-0042, KA-1; found during MS-2026-0007.
