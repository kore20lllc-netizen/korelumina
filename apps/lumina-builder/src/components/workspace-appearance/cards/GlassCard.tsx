import {
  PanelsTopLeft,
} from "lucide-react";

import {
  AppearanceDropdown,
} from "../AppearanceDropdown";

import {
  useWorkspaceAppearance,
} from "../context";

import type {
  AppearanceMaterial,
  AppearanceTint,
} from "../model";

import {
  AppearanceCard,
} from "./AppearanceCard";

type BlurPreset =
  | "light"
  | "standard"
  | "heavy";

function resolveBlurPreset(
  blur: number,
): BlurPreset {
  if (blur < 40) {
    return "light";
  }

  if (blur >= 75) {
    return "heavy";
  }

  return "standard";
}

function resolveBlurValue(
  preset: string,
): number {
  switch (preset) {
    case "light":
      return 25;

    case "heavy":
      return 90;

    case "standard":
    default:
      return 60;
  }
}

export function GlassCard() {
  const {
    state,
    actions,
  } = useWorkspaceAppearance();

  return (
    <AppearanceCard
      icon={
        <PanelsTopLeft className="h-4 w-4" />
      }
      title="Glass"
      description="Material and surface"
    >
      <AppearanceDropdown
        title="Material"
        value={state.material}
        options={[
          {
            label: "Glass",
            value: "glass",
          },
          {
            label: "Solid",
            value: "solid",
          },
          {
            label: "Mica",
            value: "mica",
          },
        ]}
        onChange={value =>
          actions.setMaterial(
            value as AppearanceMaterial,
          )
        }
      />

      <AppearanceDropdown
        title="Tint"
        value={state.tint}
        options={[
          {
            label: "None",
            value: "none",
          },
          {
            label: "Dark",
            value: "dark",
          },
          {
            label: "Frost",
            value: "frost",
          },
          {
            label: "Warm",
            value: "warm",
          },
          {
            label: "Cool",
            value: "cool",
          },
        ]}
        onChange={value =>
          actions.setTint(
            value as AppearanceTint,
          )
        }
      />

      <AppearanceDropdown
        title="Blur Mode"
        value={resolveBlurPreset(
          state.blur,
        )}
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
            label: "Heavy",
            value: "heavy",
          },
        ]}
        onChange={value =>
          actions.setBlur(
            resolveBlurValue(value),
          )
        }
      />
    </AppearanceCard>
  );
}
