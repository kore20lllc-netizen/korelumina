# LR-2026-0008 — Executive Office browser voice conversation

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 05773900..a3e61d84

Source commits: a3e61d84

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-19

Learning cycle: learning-cycle:c6ae794c2dee0bcb · written by the Chief Agent (gpt-5.5)

---

## Summary

Commit a3e61d84a985515bffa84f738e33bbba0b652c66 added browser-based voice input and read-aloud replies to the Executive Office conversation. Executive record decision:reasoning:executive-office:mvf9iac6-qhf1k9 shows a rejected decision for insufficient governed readiness basis.

## What changed

- The Executive Office conversation now supports microphone dictation into the message box and sends when the owner pauses. (`a3e61d84`, `apps/lumina-builder/src/components/workspaces/executive/state/useConversationVoice.ts`, `apps/lumina-builder/src/components/workspaces/executive/sections/ConversationPanel.tsx`)
- Replies, including the opening briefing, can now be read aloud. (`a3e61d84`, `apps/lumina-builder/src/components/workspaces/executive/state/useConversationVoice.ts`, `apps/lumina-builder/src/components/workspaces/executive/sections/ConversationPanel.tsx`)
- A Voice toggle was added to read each new answer as it arrives. (`a3e61d84`, `apps/lumina-builder/src/components/workspaces/executive/sections/ConversationPanel.tsx`)
- Read-aloud skips long hashes and canonical ids. (`a3e61d84`, `apps/lumina-builder/src/components/workspaces/executive/state/useConversationVoice.ts`)
- Browsers without speech recognition keep the microphone disabled and explain why. (`a3e61d84`, `apps/lumina-builder/src/components/workspaces/executive/state/useConversationVoice.ts`, `apps/lumina-builder/src/components/workspaces/executive/sections/ConversationPanel.tsx`)
- The Executive Office certified UI contract was updated for the voice work. (`a3e61d84`, `docs/ui-contracts/executive-office-certified-ui.json`)

## Decisions

- The first version uses the browser's own speech engines. (`a3e61d84`)
- The owner chose browser speech engines for the first version. (`a3e61d84`)
- KoreLumina does not record or store the voice input. (`a3e61d84`)
- Chrome transcription uses Google and Safari transcription uses Apple. (`a3e61d84`)
- Read-aloud runs locally. (`a3e61d84`)
- A Runtime voice using Whisper and OpenAI TTS was left as a later replacement path without changing the controls. (`a3e61d84`)
- Executive decision decision:reasoning:executive-office:mvf9iac6-qhf1k9 was rejected for insufficient governed readiness basis. (`decision:reasoning:executive-office:mvf9iac6-qhf1k9`)

## Lessons

- Voice capability must handle browsers without speech recognition by disabling unavailable controls and explaining the limitation. (`a3e61d84`, `apps/lumina-builder/src/components/workspaces/executive/state/useConversationVoice.ts`)
- Read-aloud should filter long hashes and canonical ids because Executive Office replies can include technical identifiers. (`a3e61d84`, `apps/lumina-builder/src/components/workspaces/executive/state/useConversationVoice.ts`)
- The first browser-engine implementation kept the controls stable for a later Runtime voice replacement. (`a3e61d84`)

## Open risks

- Speech recognition depends on browser vendor services because Chrome transcribes through Google and Safari through Apple. (`a3e61d84`)
- Users on browsers without speech recognition cannot use the microphone feature. (`a3e61d84`)
- Runtime voice with Whisper and OpenAI TTS remains a future replacement path. (`a3e61d84`)
- The rejected executive decision leaves governed readiness unresolved for decision:reasoning:executive-office:mvf9iac6-qhf1k9. (`decision:reasoning:executive-office:mvf9iac6-qhf1k9`)
