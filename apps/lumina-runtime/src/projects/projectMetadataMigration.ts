import { listProjects } from "./listProjects.js";
import {
  getProjectMetadata,
  setProjectMetadata,
} from "./projectMetadataStore.js";

export function backfillMissingProjectMetadata() {
  const projects = listProjects();

  for (const project of projects) {
    const existing = getProjectMetadata(project.projectId);

    if (existing) {
      continue;
    }

    setProjectMetadata({
      projectId: project.projectId,
      visibility: "private",
    });
  }
}
