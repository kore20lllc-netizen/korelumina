import { LuminaSurface } from "@/components/lumina/surface/LuminaSurface";
import { GlowCard } from "@/components/lumina/GlowCard";

export function AppearancePreview() {
  return (
    <LuminaSurface
      variant="panel"
      className="flex-1 p-8"
    >
      <GlowCard
        className="mx-auto w-full max-w-5xl"
        title="Live Appearance Preview"
        description="Changes to Lumina appearance settings are rendered here using the production appearance token pipeline."
      />
    </LuminaSurface>
  );
}
