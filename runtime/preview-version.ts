const versions = new Map<string, number>()

export function bumpPreviewVersion(projectId: string) {
  const v = (versions.get(projectId) || 0) + 1
  versions.set(projectId, v)
  return v
}

export function getPreviewVersion(projectId: string) {
  return versions.get(projectId) || 0
}
