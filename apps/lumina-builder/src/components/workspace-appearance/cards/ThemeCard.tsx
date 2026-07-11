import {
  Palette,
} from "lucide-react";

import {
  AppearanceDropdown,
} from "../AppearanceDropdown";

import {
  useWorkspaceAppearance,
} from "../context";

import type {
  AppearanceAccent,
  AppearanceAnimation,
  AppearanceContrast,
  AppearanceGlow,
} from "../model";

import {
  AppearanceCard,
} from "./AppearanceCard";

export function ThemeCard() {
  const {
    state,
    actions,
  } = useWorkspaceAppearance();

  return (
    <AppearanceCard
      icon={
        <Palette className="h-4 w-4" />
      }
      title="Theme"
      description="Color language"
    >
      <AppearanceDropdown
        title="Accent"
        value={state.accent}
        options={[
          {
            label: "Amber",
            value: "amber",
          },
          {
            label: "Blue",
            value: "blue",
          },
          {
            label: "Purple",
            value: "purple",
          },
          {
            label: "Emerald",
            value: "emerald",
          },
        ]}
        onChange={value =>
          actions.setAccent(
            value as AppearanceAccent,
          )
        }
      />

      <AppearanceDropdown
        title="Contrast"
        value={state.contrast}
        options={[
          {
            label: "Soft",
            value: "soft",
          },
          {
            label: "Balanced",
            value: "balanced",
          },
          {
            label: "High",
            value: "high",
          },
        ]}
        onChange={value =>
          actions.setContrast(
            value as AppearanceContrast,
          )
        }
      />

      <AppearanceDropdown
        title="Glow"
        value={state.glow}
        options={[
          {
            label: "None",
            value: "none",
          },
          {
            label: "Low",
            value: "low",
          },
          {
            label: "Medium",
            value: "medium",
          },
          {
            label: "High",
            value: "high",
          },
        ]}
        onChange={value =>
          actions.setGlow(
            value as AppearanceGlow,
          )
        }
      />

      <AppearanceDropdown
        title="Animation"
        value={state.animation}
        options={[
          {
            label: "Off",
            value: "off",
          },
          {
            label: "Reduced",
            value: "reduced",
          },
          {
            label: "Standard",
            value: "standard",
          },
        ]}
        onChange={value =>
          actions.setAnimation(
            value as AppearanceAnimation,
          )
        }
      />
    </AppearanceCard>
  );
}
