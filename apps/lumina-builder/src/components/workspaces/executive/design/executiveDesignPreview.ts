/*
 * EW-0 — Executive Office design preview content.
 *
 * UI is the contract: every section of the approved Chief Agent Interface
 * (docs/chief-agent/CHIEF_AGENT_INTERFACE.md) is designed first and wired
 * to Runtime later, one section per ticket. Until a section is wired it
 * renders this content under a "Design preview · not wired" badge.
 *
 * The content describes real KoreLumina state as of 2026-10-19 (tickets,
 * records, findings), so the design is judged against real work, but it is
 * a snapshot: it does not update until the section is wired.
 */

export type PreviewTone = "healthy" | "active" | "warning" | "error";

export const dashboardHealth = [
  { id: "platform", label: "Platform Health", value: "2 high", detail: "Security findings open", tone: "warning" as PreviewTone },
  { id: "runtime", label: "Runtime Health", value: "Online", detail: "Learning check every 30 min", tone: "healthy" as PreviewTone },
  { id: "knowledge", label: "Knowledge Health", value: "24", detail: "Canonical items, 3 learned", tone: "healthy" as PreviewTone },
];

export const recommendations = [
  { title: "Review ADR-0041 and ADR-0042 packages", reason: "Architecture decisions keep individual Canonical Review (ADR-0042 Decision 5).", impact: "Chief Agent reasons with both ADRs" },
  { title: "Write commit bodies that explain why", reason: "Learning Records can only cite reasons that are in the commit.", impact: "Deeper Lessons sections" },
  { title: "Schedule re-certification of Day-0", reason: "Three Learning Records were added since activation.", impact: "Curriculum drift cleared" },
];

export const projects = [
  {
    name: "KoreLumina platform",
    repository: "kore20lllc-netizen/korelumina",
    framework: "Vite React + Express (monorepo)",
    runtime: "Runtime on 127.0.0.1:4100",
    health: "2 high findings",
    tone: "warning" as PreviewTone,
    deployments: "Local development",
    mission: "Executive Office",
    knowledge: "24 canonical items",
  },
];

export const knowledgeCategories = [
  { label: "Canon and Constitution", count: 9, detail: "Vision 2050, Platform Constitution, CA-001 to CA-005" },
  { label: "Architecture", count: 8, detail: "Blueprint, Chief Agent Architecture, Evidence Model, IR" },
  { label: "Business and domain", count: 2, detail: "Business Charter, Domain Primer" },
  { label: "Learning Records", count: 3, detail: "LR-2026-0001 to LR-2026-0003" },
  { label: "Awaiting review", count: 2, detail: "ADR-0041, ADR-0042" },
];

export const memoryLayers = [
  { layer: "Working Memory", detail: "Context of the current request", state: "Per request" },
  { layer: "Conversation Memory", detail: "This conversation with the Chief Agent", state: "Not built" },
  { layer: "Session Memory", detail: "Today's work session", state: "Not built" },
  { layer: "Project Memory", detail: "Per managed project", state: "Not built" },
  { layer: "Repository Memory", detail: "Commits captured by continuous learning", state: "Since 2026-10-17" },
  { layer: "Organizational Memory", detail: "Stewarded projections of knowledge", state: "0 records" },
  { layer: "Canonical Knowledge", detail: "Certified, governed knowledge", state: "24 items" },
] as const;

export const activity = [
  { at: "Oct 19 · 02:30", type: "Knowledge", title: "LR-2026-0001 and LR-2026-0002 promoted to canonical" },
  { at: "Oct 19 · 02:20", type: "Governance", title: "Learning review policy and standing authorization recorded" },
  { at: "Oct 19 · 01:41", type: "Learning", title: "First learning cycle captured 18 commits" },
  { at: "Oct 19 · 00:43", type: "Decision", title: "ADR-0042 accepted: the commit is the approval" },
  { at: "Oct 18 · 21:40", type: "Approval", title: "First Customer Onboarding Risk Review approved" },
  { at: "Oct 18 · 20:27", type: "Activation", title: "Chief Agent activated at PROPOSE_ONLY" },
];

export const notifications = [
  { priority: "Critical", title: "None", detail: "Nothing requires acknowledgement.", tone: "healthy" as PreviewTone },
  { priority: "High", title: "F-18 open", detail: "API keys reachable by project processes.", tone: "error" as PreviewTone },
  { priority: "Normal", title: "2 packages awaiting review", detail: "ADR-0041, ADR-0042", tone: "warning" as PreviewTone },
  { priority: "Informational", title: "LR-2026-0003 written", detail: "Promotes after your next commit.", tone: "active" as PreviewTone },
];
