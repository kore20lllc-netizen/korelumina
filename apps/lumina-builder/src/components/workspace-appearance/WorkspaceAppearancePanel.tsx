import {
  AppearanceSection,
} from "./AppearanceSection";

import {
  AppearanceSlider,
} from "./AppearanceSlider";

import {
  AppearanceToggle,
} from "./AppearanceToggle";

import {
  AppearanceDropdown,
} from "./AppearanceDropdown";

import {
  useLuminaAppearance,
} from "@/components/lumina/appearance";

export interface WorkspaceAppearancePanelProps {
  open: boolean;
  onClose(): void;
}

export function WorkspaceAppearancePanel({
  open,
  onClose,
}: WorkspaceAppearancePanelProps) {
  const { settings } =
    useLuminaAppearance();

  return (
    <aside
      className={`
      fixed
      right-6
      top-24
      z-40
      w-80
      rounded-[28px]
      border
      border-white/20
      bg-[rgba(8,10,18,0.72)]
      backdrop-blur-[30px]
      shadow-2xl
      transition-all
      duration-300
      hover:border-white/30
      hover:shadow-[0_0_50px_rgba(120,90,255,.25)]
      overflow-visible
      p-5
      ${
        open
          ? "translate-x-0 opacity-100"
          : "translate-x-[420px] opacity-0 pointer-events-none"
      }
      `}
      style={{
        boxShadow: `
          0 0 0 1px rgba(255,255,255,.08),
          0 18px 64px rgba(0,0,0,.60),
          0 0 48px rgba(120,90,255,.18)
        `,
      }}
    >
      <div
        aria-hidden
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-[28px]
        "
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0) 35%)",
        }}
      />

      <div className="relative z-10 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2
          className="
            text-lg
            font-semibold
            text-amber-300
            drop-shadow-[0_0_10px_rgba(251,191,36,.45)]
          "
        >
          Workspace Appearance
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Personalize this workspace.
        </p>
        </div>

        <button
          type="button"
          aria-label="Close appearance panel"
          onClick={onClose}
          className="
            rounded-xl
            border
            border-white/10
            px-2
            py-1
            text-sm
            text-white/70
            transition
            hover:border-white/20
            hover:bg-white/5
            hover:text-white
          "
        >
          ✕
        </button>
      </div>

      <AppearanceSection title="Glass">

        <AppearanceDropdown
          title="Material"
          value="glass"
          options={[
            { label: "Glass", value: "glass" },
            { label: "Solid", value: "solid" },
            { label: "Mica", value: "mica" },
          ]}
        />

        <AppearanceDropdown
          title="Tint"
          value="dark"
          options={[
            { label: "None", value: "none" },
            { label: "Dark", value: "dark" },
            { label: "Frost", value: "frost" },
            { label: "Warm", value: "warm" },
            { label: "Cool", value: "cool" },
          ]}
        />

        <AppearanceSlider
          label="Tint Strength"
          value={65}
        />

        <AppearanceSlider
          label="Transparency"
          value={55}
        />

        <AppearanceSlider
          label="Blur"
          value={70}
        />

      </AppearanceSection>

      <AppearanceSection title="Layout">

        <AppearanceDropdown
          title="Density"
          value="standard"
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
        />

      </AppearanceSection>

      <AppearanceSection title="Material">
        <AppearanceToggle
          label={settings.material}
          checked
        />
      </AppearanceSection>
      </div>
    </aside>
  );
}
