import {
  Activity,
  Bell,
  Bot,
  Compass,
  Database,
  FolderGit2,
  History,
  Library,
  Network,
  Rocket,
  ShieldCheck,
  Sunrise,
} from "lucide-react";

import { LuminaSectionNavigator } from "@/components/lumina/workspace/primitives/LuminaSectionNavigator";
import type { View } from "@/context/WorkspaceContext";

import { ChiefAgentCommandDeck } from "./layout/ChiefAgentCommandDeck";
import { ActivityCenter } from "./sections/ActivityCenter";
import { AgentCenter } from "./sections/AgentCenter";
import { ApprovalCenter } from "./sections/ApprovalCenter";
import { ConversationPanel } from "./sections/ConversationPanel";
import { DailyBriefing } from "./sections/DailyBriefing";
import { ExecutionCenter } from "./sections/ExecutionCenter";
import { ExecutiveDashboard } from "./sections/ExecutiveDashboard";
import { KnowledgeCenter } from "./sections/KnowledgeCenter";
import { MemoryCenter } from "./sections/MemoryCenter";
import { MissionCenter } from "./sections/MissionCenter";
import { NotificationsCenter } from "./sections/NotificationsCenter";
import { PlanningCenter } from "./sections/PlanningCenter";
import { ProjectsCenter } from "./sections/ProjectsCenter";

/*
 * EW-0 — Executive Office.
 *
 * The owner's interface to the Chief Agent, designed from the approved
 * Chief Agent Interface (docs/chief-agent/CHIEF_AGENT_INTERFACE.md) in the
 * Knowledge Operations design language (materials, premium icons, flagship
 * panels, section navigator) with its own arrangement: the Chief Agent
 * command deck and the conversation side by side on top, a sticky section
 * navigator, then every section in a two-column grid, row by row.
 *
 * UI is the contract: sections are wired to Runtime
 * one ticket at a time and show a design-preview badge until then.
 * EW-1 wired the conversation, approvals, recent decisions, and the Chief
 * Agent's status (state/useExecutiveOffice.ts).
 */

const SECTIONS = [
  { id: "executive-briefing", label: "Briefing", icon: Sunrise },
  { id: "executive-overview", label: "Overview", icon: Compass },
  { id: "executive-missions", label: "Missions", icon: Rocket },
  { id: "executive-planning", label: "Planning", icon: Network },
  { id: "executive-projects", label: "Projects", icon: FolderGit2 },
  { id: "executive-knowledge", label: "Knowledge", icon: Library },
  { id: "executive-memory", label: "Memory", icon: Database },
  { id: "executive-agents", label: "Agents", icon: Bot },
  { id: "executive-execution", label: "Execution", icon: Activity },
  { id: "executive-approvals", label: "Approvals", icon: ShieldCheck },
  { id: "executive-activity", label: "Activity", icon: History },
  { id: "executive-notifications", label: "Notifications", icon: Bell },
] as const;

export function ExecutiveOfficeWorkspace({
  setView,
}: {
  setView?: (view: View) => void;
}) {
  return (
    <section
      aria-label="Executive Office"
      className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent text-white"
    >
      <span id="executive-office-top" />

      <div className="relative z-30 grid gap-6 px-6 pt-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ChiefAgentCommandDeck />
        <ConversationPanel />
      </div>

      <div className="sticky top-4 z-40 px-6 pt-5">
        <LuminaSectionNavigator
          items={SECTIONS}
          ariaLabel="Executive Office sections"
          topTargetId="executive-office-top"
          minWidthClassName="min-w-[1200px]"
          gridColumnsClassName="grid-cols-12"
        />
      </div>

      <main
        aria-label="Executive Office canvas"
        className="relative z-10 grid gap-6 px-6 pb-6 pt-5 xl:grid-cols-2"
      >
        <DailyBriefing />
        <ExecutiveDashboard />
        <MissionCenter />
        <PlanningCenter />
        <ProjectsCenter />
        <KnowledgeCenter />
        <MemoryCenter />
        <AgentCenter />
        <ExecutionCenter />
        <ApprovalCenter
          onOpenCanonicalReview={setView ? () => setView("knowledge-operations") : undefined}
        />
        <ActivityCenter />
        <NotificationsCenter />
      </main>
    </section>
  );
}

export default ExecutiveOfficeWorkspace;
