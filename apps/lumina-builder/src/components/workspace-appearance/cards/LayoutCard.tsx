import {
  LayoutGrid,
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

export function LayoutCard() {
  const {
    appearance,
    updateAppearance,
  } =
    useWorkspaceAppearance();

  return (
    <AppearanceCard
      icon={<LayoutGrid className="h-4 w-4" />}
      title="Layout"
      description="Density and spacing"
    >
      <AppearanceDropdown
        title="Density"
        value="standard"
        options={[
          {label:"Light",value:"light"},
          {label:"Standard",value:"standard"},
          {label:"Dense",value:"dense"},
          {label:"Ultra",value:"ultra"},
        ]}
        onChange={(value) => updateAppearance({})}
      />

      <AppearanceDropdown
        title="Spacing"
        value="comfortable"
        options={[
          {label:"Compact",value:"compact"},
          {label:"Comfortable",value:"comfortable"},
          {label:"Relaxed",value:"relaxed"},
        ]}
        onChange={(value) => updateAppearance({})}
      />

      <AppearanceDropdown
        title="Radius"
        value="large"
        options={[
          {label:"Small",value:"small"},
          {label:"Medium",value:"medium"},
          {label:"Large",value:"large"},
        ]}
        onChange={(value) => updateAppearance({})}
      />

      <AppearanceDropdown
        title="Elevation"
        value="floating"
        options={[
          {label:"Flat",value:"flat"},
          {label:"Raised",value:"raised"},
          {label:"Floating",value:"floating"},
        ]}
        onChange={(value) => updateAppearance({})}
      />
    </AppearanceCard>
  );
}
