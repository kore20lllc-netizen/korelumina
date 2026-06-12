const manuallyStoppedProjects = new Set<string>();

export function markRuntimeManualStop(projectId: string): void {
  manuallyStoppedProjects.add(projectId);
}

export function isRuntimeManualStop(projectId: string): boolean {
  return manuallyStoppedProjects.has(projectId);
}

export function clearRuntimeManualStop(projectId: string): void {
  manuallyStoppedProjects.delete(projectId);
}
