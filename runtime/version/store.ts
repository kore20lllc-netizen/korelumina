import { runtimeState } from "../apps/lumina-runtime/src/runtime/runtimeState";

let versions:Record<string,number> = {}

export function bumpVersion(projectId:string){
  // Use unified state system
  const version = runtimeState.bumpVersion(projectId);
  
  // Keep legacy store in sync for backward compatibility
  versions[projectId] = version;

  return version;
}

export function getVersion(projectId:string){
  // Prefer unified state
  const unifiedVersion = runtimeState.getVersion(projectId);
  
  if (unifiedVersion > 0) {
    return unifiedVersion;
  }
  
  // Fallback to legacy store
  return versions[projectId] || 0;
}
