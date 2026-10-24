import { useState } from "react";

import { useTransform } from "@/context/TransformContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { isFeatureEnabled } from "@/lib/featureFlags";

import { DeveloperCommandDeck } from "./layout/DeveloperCommandDeck";
import { EditorPanel } from "./sections/EditorPanel";
import { ExplorerPanel } from "./sections/ExplorerPanel";
import { SidePanel, type SideTab } from "./sections/SidePanel";
import { useAIAssist } from "./state/useAIAssist";
import { useDeveloperFiles } from "./state/useDeveloperFiles";
import { useRuntimeControl } from "./state/useRuntimeControl";

/*
 * MS-2026-0011: the Developer workspace in the Knowledge Operations design.
 * Everything on it reads or changes the real project through Runtime: the
 * files, the dev server and its logs, and AI Assist's drafts, which are
 * shown in full and written only when applied. What it replaced: a
 * scripted AI panel (Refactor overwrote any file with a fixed component),
 * a Build button that only announced a build, and a status bar that always
 * said "connected" and "no errors".
 */
export function DeveloperWorkspace() {
  const { activeProject, setCommandOpen } = useWorkspace();
  const projectId = activeProject?.id ?? null;
  const [tab, setTab] = useState<SideTab>("preview");
  const { openTransform } = useTransform();
  const onTransform = isFeatureEnabled("transform_to_website")
    ? () => openTransform({ source: "builder", project: activeProject })
    : null;

  const files = useDeveloperFiles(projectId);
  const ai = useAIAssist(files);
  const runtime = useRuntimeControl(projectId, tab === "logs");

  return (
    <section aria-label="Developer" className="relative flex h-full min-h-0 w-full flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent p-4 text-white md:p-6 lg:overflow-y-hidden">
      <DeveloperCommandDeck projectName={activeProject?.name ?? null} files={files} ai={ai} runtime={runtime} onCommand={() => setCommandOpen(true)} onTransform={onTransform} />
      <main aria-label="Developer canvas" className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-64 lg:shrink-0 lg:flex lg:flex-col">
          <ExplorerPanel files={files} />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorPanel files={files} />
        </div>
        <SidePanel tab={tab} setTab={setTab} runtime={runtime} ai={ai} files={files} />
      </main>
    </section>
  );
}

export default DeveloperWorkspace;
