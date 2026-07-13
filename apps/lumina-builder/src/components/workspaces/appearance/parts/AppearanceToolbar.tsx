import { LuminaSurface } from "@/components/lumina/surface/LuminaSurface";
import { LuminaWorkspaceHeader } from "@/components/lumina/workspace/LuminaWorkspaceHeader";

export function AppearanceToolbar() {
  return (
    <LuminaSurface
      variant="toolbar"
      className="overflow-hidden"
    >
      <LuminaWorkspaceHeader
        eyebrow="Appearance"
        title="Lumina Appearance"
        description="Configure the production appearance system used throughout the Lumina workspace."
      />
    </LuminaSurface>
  );
}
