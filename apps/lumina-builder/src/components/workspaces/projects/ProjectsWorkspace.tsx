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

import { ExportDialog } from "@/components/export/ExportDialog";

import { tonePill, toneText } from "../executive/shared/ExecutiveSection";
import { ProjectsCommandDeck } from "./layout/ProjectsCommandDeck";
import { ProjectsSection } from "./sections/ProjectsSection";
import { useProjectsView } from "./state/useProjectsView";

/*
 * MS-2026-0011: the Projects dashboard in the Knowledge Operations design.
 * It shows only what Runtime knows about each project; actions that do not
 * exist yet (duplicate, rename) are not offered.
 */

export function ProjectsWorkspace() {
  const view = useProjectsView();
  return (
    <section aria-label="Projects" className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent text-white">
      <div className="relative z-30 px-6 pt-6">
        <ProjectsCommandDeck view={view} />
      </div>
      <main aria-label="Projects canvas" className="relative z-10 grid gap-6 px-6 pb-6 pt-6">
        <ProjectsSection view={view} />
      </main>

      <ExportDialog project={view.exporting} onClose={() => view.setExporting(null)} />

      <AlertDialog open={Boolean(view.deleting)} onOpenChange={(open) => !open && view.setDeleting(null)}>
        <AlertDialogContent className="border border-blue-400/60 bg-slate-950/95 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-400">Delete {view.deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-sky-300/75">
              Runtime stops it and removes its files from KoreLumina. The original repository or archive is not affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {view.deleteError ? <p className={`text-sm ${toneText.error}`}>{view.deleteError}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void view.confirmDelete();
              }}
              className={`rounded-full border ${tonePill.error}`}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default ProjectsWorkspace;
