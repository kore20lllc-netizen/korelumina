export interface AppearancePreviewDefinition {
  id: string;
  title: string;
}

export const appearancePreviewRegistry = [
  {
    id: "runtime",
    title: "Runtime",
  },
  {
    id: "knowledge",
    title: "Knowledge",
  },
  {
    id: "ai",
    title: "AI",
  },
  {
    id: "developer",
    title: "Developer",
  },
  {
    id: "designer",
    title: "Designer",
  },
] satisfies AppearancePreviewDefinition[];
