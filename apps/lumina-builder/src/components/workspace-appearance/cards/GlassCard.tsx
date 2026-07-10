import {
  PanelsTopLeft,
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

export function GlassCard() {
  const {
    appearance,
    updateAppearance,
  } =
    useWorkspaceAppearance();

  return (
    <AppearanceCard
      icon={<PanelsTopLeft className="h-4 w-4" />}
      title="Glass"
      description="Material and surface"
    >
      <AppearanceDropdown
        title="Material"
        value="glass"
        options={[
          { label:"Glass", value:"glass" },
          { label:"Solid", value:"solid" },
          { label:"Mica", value:"mica" },
        ]}
        onChange={(value) => updateAppearance({})}
      />

      <AppearanceDropdown
        title="Tint"
        value="dark"
        options={[
          { label:"None", value:"none" },
          { label:"Dark", value:"dark" },
          { label:"Frost", value:"frost" },
          { label:"Warm", value:"warm" },
          { label:"Cool", value:"cool" },
        ]}
        onChange={(value) => updateAppearance({})}
      />

      <AppearanceDropdown
        title="Blur Mode"
        value="standard"
        options={[
          { label:"Light", value:"light" },
          { label:"Standard", value:"standard" },
          { label:"Heavy", value:"heavy" },
        ]}
        onChange={(value) => updateAppearance({})}
      />

      <AppearanceDropdown
        title="Shadow"
        value="soft"
        options={[
          { label:"None", value:"none" },
          { label:"Soft", value:"soft" },
          { label:"Medium", value:"medium" },
          { label:"Strong", value:"strong" },
        ]}
        onChange={(value) => updateAppearance({})}
      />
    </AppearanceCard>
  );
}
