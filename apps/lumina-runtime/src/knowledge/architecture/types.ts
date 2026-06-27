export interface ArchitectureDocument {
  id: string;
  path: string;
  relativePath: string;
  checksum: string;
  size: number;
  modifiedAt: number;
}

export interface ArchitectureManifest {
  documents: ArchitectureDocument[];
}

export type ArchitectureChangeType =
  | "new"
  | "modified"
  | "deleted"
  | "unchanged";

export interface ArchitectureChange {
  type: ArchitectureChangeType;
  document: ArchitectureDocument;
}

export interface ArchitectureChangeSet {
  changes: ArchitectureChange[];
}
