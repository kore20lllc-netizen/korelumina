import {
  createInspectorModel,
} from "@/components/lumina";

export const appearanceInspectorModel =
  createInspectorModel({
    title: "Appearance",
    description:
      "Configure the Lumina visual environment.",

    groups: [
      {
        id: "profile",
        title: "Profile",

        sections: [
          {
            id: "presets",
            title: "Presets",
            controls: [
              {
                id: "preset-placeholder",
                type: "custom",
                label: "Preset",
                control: (
                  <div className="text-sm text-muted-foreground">
                    Preset selector coming soon
                  </div>
                ),
              },
            ],
          },
        ],
      },

      {
        id: "visual",
        title: "Visual Language",

        sections: [
          {
            id: "theme",
            title: "Theme",
            controls: [],
          },
          {
            id: "material",
            title: "Material",
            controls: [],
          },
          {
            id: "density",
            title: "Density",
            controls: [],
          },
        ],
      },

      {
        id: "environment",
        title: "Environment",

        sections: [
          {
            id: "ambient",
            title: "Ambient",
            controls: [],
          },
          {
            id: "motion",
            title: "Motion",
            controls: [],
          },
        ],
      },

      {
        id: "accessibility",
        title: "Accessibility",

        sections: [],
      },

      {
        id: "advanced",
        title: "Advanced",

        sections: [],
      },
    ],
  });
