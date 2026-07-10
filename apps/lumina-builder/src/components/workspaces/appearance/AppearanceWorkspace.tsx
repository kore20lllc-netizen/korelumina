import {
  LuminaInspectorRenderer,
  LuminaWorkspaceComposer,
} from "@/components/lumina";

import {
  appearanceInspectorModel,
} from "./model";

import { AppearancePreview } from "./parts/AppearancePreview";
import { AppearanceToolbar } from "./parts/AppearanceToolbar";

import {
  WorkspaceAppearancePanel,
} from "./WorkspaceAppearancePanel";

export function AppearanceWorkspace() {
  return (
    <>
      <WorkspaceAppearancePanel />
    <LuminaWorkspaceComposer
      toolbar={<AppearanceToolbar />}
      sidebar={
        <LuminaInspectorRenderer
          model={appearanceInspectorModel}
        />
      }
      content={<AppearancePreview />}
    />
    </>
  );
}

export default AppearanceWorkspace;
