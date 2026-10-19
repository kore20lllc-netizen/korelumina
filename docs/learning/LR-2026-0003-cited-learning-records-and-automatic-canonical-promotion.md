# LR-2026-0003 — Cited Learning Records and automatic canonical promotion

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 3a4b8d41..3cdbbd5c

Source commits: 171482ef, 3cdbbd5c

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-19

Learning cycle: learning-cycle:6dee78c600985792 · written by the Chief Agent (gpt-5.5)

---

## Summary

This work made Learning Records a cited output of captured learning windows and registered docs/learning as the learning authority class (171482ef2b7c41d8f3e0bc1e6ed8211cf82b3cde). It added standing promotion authorization so approved Learning Records become canonical automatically while other knowledge classes still require per-package decisions (3cdbbd5cfd2fe9906a9102458a8f4b11f2082df7).

## What changed

- docs/learning was registered as the learning authority class. (`171482ef`)
- Captured windows are turned into Learning Records whose statements must cite real commits, files, or executive records. (`171482ef`, `apps/lumina-runtime/src/continuous-learning/LearningRecordSynthesizer.ts`, `apps/lumina-runtime/src/continuous-learning/LearningRecordWriter.ts`)
- Uncited statements are removed from Learning Records. (`171482ef`)
- Low-confidence or conflicting Learning Records are held instead of promoted. (`171482ef`)
- Learning evidence handling was added for continuous learning. (`apps/lumina-runtime/src/continuous-learning/LearningEvidence.ts`)
- Learning Record service, synthesizer, and writer components were added. (`apps/lumina-runtime/src/continuous-learning/LearningRecordService.ts`, `apps/lumina-runtime/src/continuous-learning/LearningRecordSynthesizer.ts`, `apps/lumina-runtime/src/continuous-learning/LearningRecordWriter.ts`)
- ContinuousLearningCycleService was updated to integrate Learning Record creation. (`apps/lumina-runtime/src/continuous-learning/ContinuousLearningCycleService.ts`)
- DocumentationHistoricalSourceDiscoverer was updated for documentation historical source discovery. (`apps/lumina-runtime/src/knowledge-preservation/genesis/DocumentationHistoricalSourceDiscoverer.ts`)
- A learning-records review policy and standing promotion authorization were added. (`3cdbbd5c`, `apps/lumina-runtime/src/continuous-learning/LearningPromotionAuthorization.ts`)
- AutonomousGovernedCanonicalPromotionExecutor was updated to promote approved Learning Records automatically under the new authorization. (`apps/lumina-runtime/src/knowledge-preservation/promotion/AutonomousGovernedCanonicalPromotionExecutor.ts`, `3cdbbd5c`)
- A continuous learning route was added for the promotion flow. (`apps/lumina-runtime/src/routes/continuousLearning.ts`)

## Decisions

- The system chose cited Learning Records as the durable output of captured learning windows. (`171482ef`)
- The system requires Learning Record statements to cite real commits, files, or executive records to preserve evidentiary traceability. (`171482ef`)
- The system removes uncited statements and holds low-confidence or conflicting records to prevent unsupported learning from becoming canonical. (`171482ef`)
- The standing promotion authorization is limited to authority learning with the Learning Record scope. (`3cdbbd5c`, `apps/lumina-runtime/src/continuous-learning/LearningPromotionAuthorization.ts`)
- Approved Learning Records are promoted without a per-package executive decision because of the standing owner-recorded authorization. (`3cdbbd5c`)
- Every other knowledge class still needs its per-package executive decision. (`3cdbbd5c`)

## Lessons

- LR-2026-0001 verified all 43 file citations against git. (`171482ef`)
- End-to-end scratch-copy verification showed LR-2026-0001 became canonical. (`3cdbbd5c`)
- End-to-end scratch-copy verification showed LR-2026-0001 appeared in Chief Agent reasoning context. (`3cdbbd5c`)
- Learning Record behavior was covered by tests. (`apps/lumina-runtime/src/continuous-learning/__tests__/LearningRecord.test.ts`)
- Continuous learning cycle behavior was covered by tests. (`apps/lumina-runtime/src/continuous-learning/__tests__/ContinuousLearningCycleService.test.ts`)
- Learning promotion authorization behavior was covered by tests. (`apps/lumina-runtime/src/continuous-learning/__tests__/LearningPromotionAuthorization.test.ts`)
- Documentation historical source discovery behavior was covered by tests. (`apps/lumina-runtime/src/knowledge-preservation/genesis/__tests__/DocumentationHistoricalSourceDiscoverer.test.ts`)

## Open risks

- Automatic promotion does not apply outside authority learning with the Learning Record scope. (`3cdbbd5c`)
- Other knowledge classes still require per-package executive decisions. (`3cdbbd5c`)
- The pre-customer architecture risk review executive decision was rejected. (`decision:reasoning:ko5e-first-reasoning-test-2`)
- Rejected decision:reasoning:ko5e-first-reasoning-test-2 should not be treated as an approved governance basis. (`decision:reasoning:ko5e-first-reasoning-test-2`)
