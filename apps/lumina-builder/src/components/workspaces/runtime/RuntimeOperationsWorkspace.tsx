import { Boxes, GitCommitVertical, Radio, ScrollText, ServerCog } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LuminaSectionNavigator } from "@/components/lumina/workspace/primitives/LuminaSectionNavigator";

import { tonePill } from "../executive/shared/ExecutiveSection";
import { RuntimeOpsCommandDeck } from "./layout/RuntimeOpsCommandDeck";
import { EventsSection, LifecycleSection, LogsSection, ProjectSection, ProjectsSection } from "./sections/RuntimeOpsSections";
import { useRuntimeOpsView } from "./state/useRuntimeOpsView";

/*
 * MS-2026-0011: Runtime Operations in the Knowledge Operations design, with
 * the Executive Office's arrangement. Data, actions and shortcuts are the
 * live Runtime service's; only what Runtime measures is shown.
 */

const SECTIONS = [
  { id: "runtime-ops-projects", label: "Projects", icon: Boxes },
  { id: "runtime-ops-project", label: "Project", icon: ServerCog },
  { id: "runtime-ops-logs", label: "Logs", icon: ScrollText },
  { id: "runtime-ops-events", label: "Events", icon: Radio },
  { id: "runtime-ops-lifecycle", label: "Lifecycle", icon: GitCommitVertical },
] as const;

const ACTION_COPY = {
  restart: { title: "Restart", body: "Runtime stops the project's process and starts it again. Anyone using its preview loses the connection briefly." },
  shutdown: { title: "Stop", body: "Runtime stops the project's process. Its preview goes offline until you start it again." },
} as const;

export function RuntimeOperationsWorkspace() {
  const view = useRuntimeOpsView();
  const confirming = view.confirming;
  const copy = confirming && (confirming.action === "restart" || confirming.action === "shutdown") ? ACTION_COPY[confirming.action] : null;
  const target = confirming ? view.snapshot?.projects.find((project) => project.id === confirming.projectId) : null;

  return (
    <section aria-label="Runtime Operations" className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent text-white">
      <span id="runtime-ops-top" />
      <div className="relative z-30 px-6 pt-6">
        <RuntimeOpsCommandDeck view={view} />
      </div>
      <div className="sticky top-4 z-40 px-6 pt-5">
        <LuminaSectionNavigator items={SECTIONS} ariaLabel="Runtime Operations sections" topTargetId="runtime-ops-top" minWidthClassName="min-w-[600px]" gridColumnsClassName="grid-cols-5" />
      </div>
      <main aria-label="Runtime Operations canvas" className="relative z-10 grid gap-6 px-6 pb-6 pt-5 xl:grid-cols-2">
        <ProjectsSection view={view} />
        <ProjectSection view={view} />
        <div className="xl:col-span-2">
          <LogsSection view={view} />
        </div>
        <EventsSection view={view} />
        <LifecycleSection view={view} />
      </main>

      <AlertDialog open={Boolean(copy)} onOpenChange={(open) => !open && view.cancel()}>
        <AlertDialogContent className="border border-blue-400/60 bg-slate-950/95 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-400">
              {copy?.title} {target?.name ?? confirming?.projectId}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sky-300/75">{copy?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={view.confirm} className={`rounded-full border ${confirming?.action === "shutdown" ? tonePill.error : tonePill.warning}`}>
              {copy?.title}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default RuntimeOperationsWorkspace;
