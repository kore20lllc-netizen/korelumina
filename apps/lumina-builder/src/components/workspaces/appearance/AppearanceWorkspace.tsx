import {
  LuminaInspectorRenderer,
  LuminaWorkspaceComposer,
} from "@/components/lumina";

import {
  appearanceInspectorModel,
} from "./model/appearanceInspectorModel";

import {
  AppearancePreview,
} from "./parts/AppearancePreview";

import {
  AppearanceToolbar,
} from "./parts/AppearanceToolbar";

export function AppearanceWorkspace() {
  return (
    <LuminaWorkspaceComposer
      toolbar={
        <AppearanceToolbar />
      }
      sidebar={
        <LuminaInspectorRenderer
          model={appearanceInspectorModel}
        />
      }
      content={
        <AppearancePreview />
      }
    />
  );
}

export default AppearanceWorkspace;
