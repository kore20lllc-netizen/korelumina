export interface RuntimeProject {
  projectId: string;
  path: string;
  hasPackageJson: boolean;
  framework?: string;
  sourceUrl?: string;
  repoOwner?: string;
  repoName?: string;
  ownerId?: string;
  teamId?: string;
  createdBy?: string;
}

export interface RuntimeSession {
  projectId: string;
  framework?: string;
  port?: number;
  pid?: number;
  startedAt?: number;
  url: string;
  status?: string;
  logs?: string[];
}

export type RuntimeEvent =
  | {
      type: "runtime:log";
      projectId: string;
      line: string;
      timestamp: number;
    }
  | {
      type: "runtime:state";
      projectId: string;
      status: string;
      timestamp: number;
    }
  | {
      type: "runtime:error";
      projectId: string;
      error: string;
      timestamp: number;
    }
  | {
      type: "runtime:file-changed";
      projectId: string;
      file: string;
      sha256?: string;
      timestamp: number;
    };

export interface RuntimeImportResult {
  ok: true;
  action: "cloned" | "pulled";
  projectId: string;
  projectPath: string;
  framework?: string;
  repo?: {
    repoUrl: string;
    owner: string;
    repo: string;
  };
}

export interface RuntimeFileListResponse {
  ok: boolean;
  projectId: string;
  files: string[];
  error?: string;
}

export interface RuntimeFileReadResponse {
  ok: boolean;
  projectId: string;
  file: string;
  content: string;
  sha256: string;
  error?: string;
}

export interface RuntimeFileWriteResponse {
  ok: boolean;
  projectId: string;
  file: string;
  sha256?: string;
  currentSha256?: string;
  error?: string;
}

export interface RuntimeDraftPatch {
  type: "replace-text" | "create-file" | "delete-file";
  file: string;
  content?: string;
  find?: string;
  replace?: string;
  diffPreview?: string;
}

export interface RuntimeDraft {
  id: string;
  projectId: string;
  status: "draft" | "applied" | "reverted";
  patches: RuntimeDraftPatch[];
  createdAt: number;
  appliedAt?: number;
}

export interface RuntimeCreateDraftResponse {
  ok: boolean;
  mode?: string;
  note?: string;
  prompt?: string;
  draft: RuntimeDraft;
  plan?: unknown;
  report?: unknown;
  error?: string;
}

export interface RuntimeApplyDraftResponse {
  ok: boolean;
  draftId: string;
  projectId: string;
  result?: {
    applied: number;
    skipped: number;
    files: string[];
    errors: string[];
    snapshots: number;
  };
  beforeScore?: number;
  afterScore?: number;
  improvedBy?: number;
  report?: unknown;
  error?: string;
}
