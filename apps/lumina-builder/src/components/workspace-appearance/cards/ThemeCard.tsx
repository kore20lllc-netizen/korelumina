import {
  Palette,
} from "lucide-react";

import {
  AppearanceDropdown,
} from "../AppearanceDropdown";

import {
  AppearanceCard,
} from "./AppearanceCard";

import {
  useWorkspaceAppearance,
} from "../context";

export function ThemeCard() {
  const {
    appearance,
    updateAppearance,
  } =
    useWorkspaceAppearance();

  return (
    <AppearanceCard
      icon={<Palette className="h-4 w-4" />}
      title="Theme"
      description="Color language"
    >
      <AppearanceDropdown
        title="Accent"
        value="amber"
        options={[
          {label:"Amber",value:"amber"},
          {label:"Blue",value:"blue"},
          {label:"Purple",value:"purple"},
          {label:"Emerald",value:"emerald"},
        ]}
        onChange={(value) => updateAppearance({})}
      />

      <AppearanceDropdown
        title="Contrast"
        value="balanced"
        options={[
          {label:"Soft",value:"soft"},
          {label:"Balanced",value:"balanced"},
          {label:"High",value:"high"},
        ]}
        onChange={(value) => updateAppearance({})}
      />

      <AppearanceDropdown
        title="Glow"
        value="medium"
        options={[
          {label:"None",value:"none"},
          {label:"Low",value:"low"},
          {label:"Medium",value:"medium"},
          {label:"High",value:"high"},
        ]}
        onChange={(value) => updateAppearance({})}
      />

      <AppearanceDropdown
        title="Animation"
        value="standard"
        options={[
          {label:"Off",value:"off"},
          {label:"Reduced",value:"reduced"},
          {label:"Standard",value:"standard"},
        ]}
        onChange={(value) => updateAppearance({})}
      />
    </AppearanceCard>
  );
}
