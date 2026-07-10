import { AppearanceCard } from "./AppearanceCard";
import { LayoutGrid } from "lucide-react";

export function LayoutCard() {
  return (
    <AppearanceCard
      icon={<LayoutGrid className="h-5 w-5" />}
      title="Layout"
      description="Density and spacing"
    >
      <div />
    </AppearanceCard>
  );
}
