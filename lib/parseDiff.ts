export type FileStatus =
  | "added"
  | "modified"
  | "deleted";

export interface DiffLine {
  type?: "context" | "add" | "delete";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffChunk {
  oldStart?: number;
  oldLines?: number;
  newStart?: number;
  newLines?: number;
  lines?: string[];
}

export interface FileDiff {
  /**
   * Canonical file path.
   */
  file: string;

  /**
   * Compatibility alias used by
   * components/marketing/DiffViewer.tsx.
   */
  fileName: string;

  status: FileStatus;
  additions?: number;
  deletions?: number;
  oldPath?: string;
  newPath?: string;

  /**
   * Used by DiffTabView.tsx.
   */
  changes: DiffLine[];

  chunks?: DiffChunk[];
  content?: string;
}

/**
 * Minimal safe parser placeholder.
 * Returns an empty array but preserves the contract
 * required by all UI components.
 */
export function parseDiff(_input: string): FileDiff[] {
  return [];
}
