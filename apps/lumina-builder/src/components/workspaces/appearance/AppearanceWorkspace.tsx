import {
  LuminaWorkspaceComposer,
} from "@/components/lumina";

import { AppearancePreview } from "./parts/AppearancePreview";
import { AppearanceSidebar } from "./parts/AppearanceSidebar";
import { AppearanceToolbar } from "./parts/AppearanceToolbar";

export function AppearanceWorkspace() {
  return (
    <LuminaWorkspaceComposer
      toolbar={<AppearanceToolbar />}
      sidebar={<AppearanceSidebar />}
      content={<AppearancePreview />}
    />
  );
}

export default AppearanceWorkspace;
