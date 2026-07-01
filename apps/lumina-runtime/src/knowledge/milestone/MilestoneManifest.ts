export interface MilestoneManifestEntry {
  id: string;

  title: string;

  status: string;

  updatedAt: number;
}

export interface MilestoneManifest {
  milestones: MilestoneManifestEntry[];
}
