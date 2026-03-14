const patches = new Map<string, any[]>()

export function pushPatch(projectId: string, patch: any){
  const list = patches.get(projectId) || []
  list.push(patch)
  patches.set(projectId, list)
}

export function drainPatches(projectId: string){
  const list = patches.get(projectId) || []
  patches.set(projectId, [])
  return list
}
