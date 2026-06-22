export type RuntimeState = "idle" | "starting" | "running" | "error";

export interface Project {
  id: string;
  projectId?: string;
  name: string;
  type: "website" | "webapp" | "dashboard" | "ai-tool" | "import" | "mobile";
  lastEdited: string;
  status: "draft" | "live" | "building";
  accent: "magenta" | "violet" | "cyan" | "gold";
  previewUrl?: string;
  builderUrl?: string;
  framework?: string;
  packageManager?: string;
  entryFile?: string;
  sourceUrl?: string;
}

export interface RuntimeStatus {
  ready: boolean;
  state: RuntimeState;
  url?: string;
  message?: string;
}

export interface PreviewResponse {
  url: string;
}

export interface ImportResponse {
  projectId: string;
  name: string;
  framework?: string;
  packageManager?: string;
  entryFile?: string;
}

export interface FileReadResponse {
  path: string;
  content: string;
}

export interface DraftResponse {
  draftId: string;
  files: { path: string; content: string }[];
  summary?: string;
}