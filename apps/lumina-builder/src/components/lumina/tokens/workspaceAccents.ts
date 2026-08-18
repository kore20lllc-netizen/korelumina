
const coreLuminaTitle =
  "bg-gradient-to-r from-white via-[#C084FC] via-[#E879F9] to-[#67E8F9] bg-clip-text text-transparent";

const operationsTitle =
  "bg-gradient-to-r from-[#F7D774] via-[#C98212] to-[#9C5F08] bg-clip-text text-transparent";

export const workspaceAccents = {
  runtime: {
    name: "Runtime Operations",
    color: "amber",
    gradient:
      "bg-gradient-to-r from-[#F7D774] via-[#E6A72A] to-[#9C5F08]",
    text: coreLuminaTitle,
    glow:
      "shadow-[0_0_36px_rgba(201,130,18,.28)]",
    border:
      "border-[#C98212]/35",
    ring:
      "ring-[#C98212]/40",
  },

  knowledge: {
    name: "Knowledge Operations",
    color: "violet",
    gradient:
      "bg-gradient-to-r from-violet-300 via-violet-400 to-fuchsia-400",
    text: coreLuminaTitle,
  },

  ai: {
    name: "AI Operations",
    color: "cyan",
    gradient:
      "bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-400",
    text: coreLuminaTitle,
  },

  deployment: {
    name: "Deployment Operations",
    color: "emerald",
    gradient:
      "bg-gradient-to-r from-emerald-300 via-green-400 to-lime-400",
    text: coreLuminaTitle,
  },

  security: {
    name: "Security Operations",
    color: "crimson",
    gradient:
      "bg-gradient-to-r from-red-300 via-rose-400 to-red-500",
    text: coreLuminaTitle,
  },
} as const;

export type WorkspaceAccent =
  keyof typeof workspaceAccents;
