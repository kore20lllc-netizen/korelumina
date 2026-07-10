import { AppearanceCard } from "./AppearanceCard";
import { Palette } from "lucide-react";

export function ThemeCard() {
  return (
    <AppearanceCard
      icon={<Palette className="h-5 w-5" />}
      title="Theme"
      description="Colors and accents"
    >
      <div />
    </AppearanceCard>
  );
}
