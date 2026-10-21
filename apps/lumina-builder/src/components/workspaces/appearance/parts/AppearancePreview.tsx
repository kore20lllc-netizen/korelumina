import { LuminaSurface } from "@/components/lumina/surface/LuminaSurface";
import { GlowCard } from "@/components/lumina/GlowCard";

export function AppearancePreview() {
  return (
    <LuminaSurface
      variant="panel"
      className="flex-1 p-8"
    >
      <GlowCard className="mx-auto w-full max-w-5xl p-6">
        <h3 className="text-lg font-semibold">Live Appearance Preview</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Changes to Lumina appearance settings are rendered here using the production appearance token pipeline.
        </p>
      </GlowCard>
    </LuminaSurface>
  );
}
