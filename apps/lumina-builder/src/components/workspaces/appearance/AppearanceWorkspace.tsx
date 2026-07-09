import { AppearancePreview } from "./parts/AppearancePreview";
import { AppearanceSidebar } from "./parts/AppearanceSidebar";
import { AppearanceToolbar } from "./parts/AppearanceToolbar";

export function AppearanceWorkspace() {
  return (
    <div className="flex h-full flex-col gap-6">
      <AppearanceToolbar />

      <div className="flex flex-1 gap-6">
        <AppearanceSidebar />

        <AppearancePreview />
      </div>
    </div>
  );
}

export default AppearanceWorkspace;
