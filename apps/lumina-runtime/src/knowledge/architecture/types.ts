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
