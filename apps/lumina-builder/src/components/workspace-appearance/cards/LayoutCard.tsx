import {
  LayoutGrid,
} from "lucide-react";

import {
  AppearanceDropdown,
} from "../AppearanceDropdown";

import {
  useWorkspaceAppearance,
} from "../context";

import type {
  AppearanceDensity,
  AppearanceElevation,
  AppearanceRadius,
  AppearanceSpacing,
} from "../model";

import {
  AppearanceCard,
} from "./AppearanceCard";

export function LayoutCard() {
  const {
    state,
    actions,
  } = useWorkspaceAppearance();

  return (
    <AppearanceCard
      icon={
        <LayoutGrid className="h-4 w-4" />
      }
      title="Layout"
      description="Density and spacing"
    >
      <AppearanceDropdown
        title="Density"
        value={state.density}
        options={[
          {
            label: "Light",
            value: "light",
          },
          {
            label: "Standard",
            value: "standard",
          },
          {
            label: "Dense",
            value: "dense",
          },
          {
            label: "Ultra",
            value: "ultra",
          },
        ]}
        onChange={value =>
          actions.setDensity(
            value as AppearanceDensity,
          )
        }
      />

      <AppearanceDropdown
        title="Spacing"
        value={state.spacing}
        options={[
          {
            label: "Compact",
            value: "compact",
          },
          {
            label: "Comfortable",
            value: "comfortable",
          },
          {
            label: "Relaxed",
            value: "relaxed",
          },
        ]}
        onChange={value =>
          actions.setSpacing(
            value as AppearanceSpacing,
          )
        }
      />

      <AppearanceDropdown
        title="Radius"
        value={state.radius}
        options={[
          {
            label: "Small",
            value: "small",
          },
          {
            label: "Medium",
            value: "medium",
          },
          {
            label: "Large",
            value: "large",
          },
        ]}
        onChange={value =>
          actions.setRadius(
            value as AppearanceRadius,
          )
        }
      />

      <AppearanceDropdown
        title="Elevation"
        value={state.elevation}
        options={[
          {
            label: "Flat",
            value: "flat",
          },
          {
            label: "Raised",
            value: "raised",
          },
          {
            label: "Floating",
            value: "floating",
          },
        ]}
        onChange={value =>
          actions.setElevation(
            value as AppearanceElevation,
          )
        }
      />
    </AppearanceCard>
  );
}
