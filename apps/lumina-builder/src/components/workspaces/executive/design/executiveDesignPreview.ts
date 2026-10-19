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
  { id: "mission", label: "Mission Health", value: "1 active", detail: "Executive Office (EW)", tone: "active" as PreviewTone },
  { id: "platform", label: "Platform Health", value: "2 high", detail: "Security findings open", tone: "warning" as PreviewTone },
  { id: "runtime", label: "Runtime Health", value: "Online", detail: "Learning check every 30 min", tone: "healthy" as PreviewTone },
  { id: "knowledge", label: "Knowledge Health", value: "24", detail: "Canonical items, 3 learned", tone: "healthy" as PreviewTone },
];

export const recommendations = [
  { title: "Review ADR-0041 and ADR-0042 packages", reason: "Architecture decisions keep individual Canonical Review (ADR-0042 Decision 5).", impact: "Chief Agent reasons with both ADRs" },
  { title: "Write commit bodies that explain why", reason: "Learning Records can only cite reasons that are in the commit.", impact: "Deeper Lessons sections" },
  { title: "Schedule re-certification of Day-0", reason: "Three Learning Records were added since activation.", impact: "Curriculum drift cleared" },
];

export const currentMission = {
  id: "EW",
  title: "Executive Office",
  objective: "Give the owner one place to brief, converse with, and govern the Chief Agent.",
  stage: "Mission",
  progress: 10,
  next: "EW-0 design approval",
};

export const missionLifecycle = ["Vision", "Objective", "Mission", "Execution", "Validation", "Knowledge"] as const;

export const missions = [
  {
    id: "CL-1",
    title: "Continuous learning v1",
    stage: "Knowledge",
    progress: 100,
    tone: "healthy" as PreviewTone,
    agents: ["Chief Agent"],
    approvals: 0,
    risks: ["Capture takes about 22 s while Runtime is busy"],
    recoveryAnchor: "d7cbbd72",
    knowledge: ["LR-2026-0001", "LR-2026-0002", "LR-2026-0003"],
  },
  {
    id: "EW",
    title: "Executive Office",
    stage: "Mission",
    progress: 10,
    tone: "active" as PreviewTone,
    agents: ["Chief Agent"],
    approvals: 1,
    risks: ["Sections without backend stay in design preview"],
    recoveryAnchor: "d7cbbd72",
    knowledge: [],
  },
  {
    id: "SEC-1",
    title: "Pre-customer security hardening",
    stage: "Objective",
    progress: 0,
    tone: "warning" as PreviewTone,
    agents: [],
    approvals: 0,
    risks: ["F-18 API key exposure", "Signed-out developer role"],
    recoveryAnchor: null,
    knowledge: [],
  },
];

export const planningTree = [
  { level: "Vision", title: "KoreLumina Vision 2050: enduring engineering capability" },
  { level: "Roadmap", title: "AI-operated engineering under human governance" },
  { level: "Objective", title: "Onboard the first paying customer" },
  { level: "Mission", title: "Pre-customer security hardening (SEC-1)" },
  { level: "Epic", title: "Runtime and access boundaries" },
  { level: "Sprint", title: "Security sprint 1" },
  { level: "Task", title: "Stop passing API keys to project processes (F-18)" },
] as const;

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

export const agents = [
  { name: "Chief Agent", status: "Active", mission: "Executive Office", workload: "Reasoning, learning", lastActivity: "LR-2026-0003 written", confidence: "0.88 last decision", blocked: "No", approvals: "PROPOSE_ONLY", tone: "healthy" as PreviewTone },
  { name: "Engineer Agent", status: "Not built", mission: "—", workload: "—", lastActivity: "—", confidence: "—", blocked: "—", approvals: "—", tone: "warning" as PreviewTone },
];

export const executionItems = [
  { title: "Learning cycle: CL-1d and CL-1e commits", state: "Completed", detail: "2 commits captured, LR-2026-0003 written", tone: "healthy" as PreviewTone },
  { title: "Learning cycle: CL-1b and CL-1c commit", state: "Failed, then recovered", detail: "Uncommitted Learning Record blocked capture; fixed in CL-1e", tone: "warning" as PreviewTone },
  { title: "Chief Agent operations", state: "Propose-only", detail: "No action may execute at this autonomy level (ADR-0041)", tone: "active" as PreviewTone },
];

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
