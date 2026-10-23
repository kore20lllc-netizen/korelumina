import { useEffect } from "react";
import { AlertTriangle, Boxes, ClipboardList, Lock, Wrench } from "lucide-react";

import { LuminaSectionNavigator } from "@/components/lumina/workspace/primitives/LuminaSectionNavigator";
import { useWorkspace } from "@/context/WorkspaceContext";
import { canAccess } from "@/services/workspaceAccessService";

import { InHouseCommandDeck } from "./layout/InHouseCommandDeck";
import { EngagementsSection } from "./sections/EngagementsSection";
import { AttentionSection, ProjectsSection, ToolsSection } from "./sections/InHouseSections";
import { useInHouseConsole } from "./state/useInHouseConsole";

/*
 * MS-2026-0011: the In-House Dev console in the Knowledge Operations
 * design. It opens the internal tools that exist and reads their live
 * state; a tool that is not built is listed as not built.
 */

const SECTIONS = [
  { id: "inhouse-engagements", label: "Engagements", icon: ClipboardList },
  { id: "inhouse-attention", label: "Attention", icon: AlertTriangle },
  { id: "inhouse-tools", label: "Tools", icon: Wrench },
  { id: "inhouse-projects", label: "Projects", icon: Boxes },
] as const;

function Console() {
  const view = useInHouseConsole();
  return (
    <section aria-label="In-House Dev" className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent text-white">
      <span id="inhouse-top" />
      <div className="relative z-30 px-6 pt-6">
        <InHouseCommandDeck view={view} />
      </div>
      <div className="sticky top-4 z-40 px-6 pt-5">
        <LuminaSectionNavigator items={SECTIONS} ariaLabel="In-House Dev sections" topTargetId="inhouse-top" minWidthClassName="min-w-[560px]" gridColumnsClassName="grid-cols-4" />
      </div>
      <main aria-label="In-House Dev canvas" className="relative z-10 grid gap-6 px-6 pb-6 pt-5 xl:grid-cols-2">
        <div className="xl:col-span-2">
          <EngagementsSection view={view} />
        </div>
        <AttentionSection view={view} />
        <ToolsSection view={view} />
        <div className="xl:col-span-2">
          <ProjectsSection view={view} />
        </div>
      </main>
    </section>
  );
}

export function InHouseDevWorkspace() {
  const { setView } = useWorkspace();
  const allowed = canAccess("inhouseDevDashboard");

  useEffect(() => {
    if (!allowed) setView("dashboard");
  }, [allowed, setView]);

  if (!allowed) {
    return (
      <section aria-label="In-House Dev" className="grid h-full place-items-center p-10 text-white">
        <div className="max-w-md rounded-[20px] border border-white/10 bg-slate-950/60 p-8 text-center">
          <Lock className="mx-auto mb-3 h-6 w-6 text-sky-300/60" />
          <div className="mb-1 text-xl font-semibold text-amber-400">Super Admin only</div>
          <p className="text-sm text-sky-300/70">
            The In-House Dev console needs the <span className="font-mono">inhouseDevDashboard</span> capability.
          </p>
        </div>
      </section>
    );
  }
  return <Console />;
}

export default InHouseDevWorkspace;
