export const premiumSpacing = {
  inline: {
    compact: "gap-1.5",
    dense: "gap-2",
    standard: "gap-3",
    relaxed: "gap-4",
    spacious: "gap-5",
    expansive: "gap-6",
  },

  stack: {
    compact: "space-y-2",
    dense: "space-y-3",
    standard: "space-y-4",
    relaxed: "space-y-5",
    spacious: "space-y-6",
  },

  inset: {
    compact: "p-3",
    dense: "p-4",
    standard: "p-5",
    relaxed: "p-6",
  },

  insetX: {
    compact: "px-2",
    dense: "px-3",
    standard: "px-4",
    relaxed: "px-5",
    spacious: "px-6",
  },

  insetY: {
    compact: "py-1",
    dense: "py-2",
    standard: "py-3",
    relaxed: "py-4",
  },

  section: {
    compact: "mt-2",
    dense: "mt-3",
    standard: "mt-4",
    relaxed: "mt-5",
    spacious: "mt-6",
  },

  radius: {
    control: "rounded-[14px]",
    compactCard: "rounded-[16px]",
    card: "rounded-[18px]",
    panel: "rounded-[20px]",
    prominentPanel: "rounded-[22px]",
    shell: "rounded-[24px]",
    workspace: "rounded-[32px]",
  },
} as const;

export type PremiumSpacing =
  typeof premiumSpacing;
