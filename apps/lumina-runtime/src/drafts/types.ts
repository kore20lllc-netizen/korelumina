export type DraftPatch =
  | {
      type: "replace-text";
      file: string;
      find: string;
      replace: string;
      diffPreview: string;
    }
  | {
      type: "delete-file";
      file: string;
      diffPreview: string;
    }
  | {
      type: "create-file";
      file: string;
      content: string;
      diffPreview: string;
    };

export type DraftSnapshot = {
  file: string;
  existedBefore: boolean;
  before: string;
  after: string;
};

export type FixDraft = {
  draftId: string;
  projectId: string;
  createdAt: number;
  patches: DraftPatch[];
  status: "draft" | "applied" | "reverted";
  appliedAt?: number;
  revertedAt?: number;
  snapshots?: DraftSnapshot[];
};
