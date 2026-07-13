import {
  AppearanceSection,
} from "./AppearanceSection";

import {
  AppearanceSlider,
} from "./AppearanceSlider";

import {
  AppearanceDropdown,
} from "./AppearanceDropdown";

import {
  useWorkspaceAppearance,
} from "./context";

import type {
  WorkspaceAppearanceModel,
} from "./model";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaSurface,
} from "@/components/lumina/surface/LuminaSurface";

export interface WorkspaceAppearancePanelProps {
  open: boolean;
  onClose(): void;
}

export function WorkspaceAppearancePanel({
  open,
  onClose,
}: WorkspaceAppearancePanelProps) {
  const {
    state,
    actions,
  } = useWorkspaceAppearance();

  return (
    <LuminaSurface
      asChild
      variant="panel"
    >
      <aside
        aria-hidden={!open}
        className={[
          "fixed right-6 top-24 z-40",
          "w-80 max-h-[calc(100vh-8rem)]",
          "overflow-y-auto p-5",
          "transition-all duration-300",
          open
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-[420px] opacity-0",
        ].join(" ")}
      >
        <div className="space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                Workspace Appearance
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Personalize this workspace.
              </p>
            </div>

            <LuminaButton
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close appearance panel"
              onClick={onClose}
            >
              ✕
            </LuminaButton>
          </header>

          <AppearanceSection title="Material">
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
              onChange={(value) =>
                actions.setMaterial(
                  value as WorkspaceAppearanceModel["material"],
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
              onChange={(value) =>
                actions.setTint(
                  value as WorkspaceAppearanceModel["tint"],
                )
              }
            />

            <AppearanceSlider
              label="Tint Strength"
              value={state.tintStrength}
              onChange={actions.setTintStrength}
            />

            <AppearanceSlider
              label="Transparency"
              value={state.transparency}
              onChange={actions.setTransparency}
            />

            <AppearanceSlider
              label="Blur"
              value={state.blur}
              onChange={actions.setBlur}
            />
          </AppearanceSection>

          <AppearanceSection title="Surface">
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
              onChange={(value) =>
                actions.setDensity(
                  value as WorkspaceAppearanceModel["density"],
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
              onChange={(value) =>
                actions.setSpacing(
                  value as WorkspaceAppearanceModel["spacing"],
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
              onChange={(value) =>
                actions.setRadius(
                  value as WorkspaceAppearanceModel["radius"],
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
              onChange={(value) =>
                actions.setElevation(
                  value as WorkspaceAppearanceModel["elevation"],
                )
              }
            />
          </AppearanceSection>

          <AppearanceSection title="Accent">
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
              onChange={(value) =>
                actions.setAccent(
                  value as WorkspaceAppearanceModel["accent"],
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
              onChange={(value) =>
                actions.setContrast(
                  value as WorkspaceAppearanceModel["contrast"],
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
              onChange={(value) =>
                actions.setGlow(
                  value as WorkspaceAppearanceModel["glow"],
                )
              }
            />

            <AppearanceSlider
              label="Shadow Intensity"
              value={state.shadowIntensity}
              onChange={actions.setShadowIntensity}
            />

            <AppearanceSlider
              label="Glow Intensity"
              value={state.glowIntensity}
              onChange={actions.setGlowIntensity}
            />
          </AppearanceSection>

          <AppearanceSection title="Motion">
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
              onChange={(value) =>
                actions.setAnimation(
                  value as WorkspaceAppearanceModel["animation"],
                )
              }
            />

            <AppearanceSlider
              label="Motion"
              value={state.motion}
              onChange={actions.setMotion}
            />
          </AppearanceSection>

          <LuminaButton
            type="button"
            variant="outline"
            className="w-full"
            onClick={actions.reset}
          >
            Reset appearance
          </LuminaButton>
        </div>
      </aside>
    </LuminaSurface>
  );
}
