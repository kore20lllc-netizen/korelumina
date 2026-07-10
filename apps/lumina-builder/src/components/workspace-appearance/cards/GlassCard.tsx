import { AppearanceCard } from "./AppearanceCard";
import { GlassWater } from "lucide-react";

export function GlassCard() {
  return (
    <AppearanceCard
      icon={<GlassWater className="h-5 w-5" />}
      title="Glass"
      description="Material and tint"
    >
      <div />
    </AppearanceCard>
  );
}
