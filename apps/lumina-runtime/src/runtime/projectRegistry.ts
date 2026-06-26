import {
  getRuntime,
  serializeRuntime,
  type PublicRuntimeRecord,
} from "./registry.js";

import { listProjects } from "../projects/listProjects.js";
import {
  getProjectMetadata,
  type ProjectMetadata,
} from "../projects/projectMetadataStore.js";

export type RuntimeProject = ReturnType<
  typeof listProjects
>[number];

export interface RuntimeProjectRecord {
  project: RuntimeProject;
  metadata: ProjectMetadata | null;
  runtime: PublicRuntimeRecord | null;
}

export function listRuntimeProjects(): RuntimeProject[] {
  return listProjects();
}

export function getRuntimeProject(
  projectId: string,
): RuntimeProjectRecord | null {
  const project = listProjects().find(
    (p) => p.projectId === projectId,
  );

  if (!project) {
    return null;
  }

  const runtime = getRuntime(projectId);

  return {
    project,
    metadata: getProjectMetadata(projectId),
    runtime: runtime
      ? serializeRuntime(runtime)
      : null,
  };
}

export function projectExists(
  projectId: string,
): boolean {
  return (
    listProjects().some(
      (p) => p.projectId === projectId,
    )
  );
}
