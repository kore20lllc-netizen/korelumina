import type { IntentState } from "./types"

export function resolveIntentRoute(projectId:string, state:IntentState){

  const { buildIntent, userMode } = state

  if(buildIntent === "website" && userMode === "nontech"){
    return `/studio-projects/${projectId}/website-builder`
  }

  if(buildIntent === "website" && userMode === "designer"){
    return `/studio-projects/${projectId}/workspace-designer-website`
  }

  if(userMode === "dev"){
    return `/studio-projects/${projectId}/builder`
  }

  if(buildIntent === "webapp" && userMode === "nontech"){
    return `/studio-projects/${projectId}/app-builder`
  }

  if(buildIntent === "mobile" && userMode === "nontech"){
    return `/studio-projects/${projectId}/mobile-builder`
  }

  if(buildIntent === "backend" && userMode === "nontech"){
    return `/studio-projects/${projectId}/backend-builder`
  }

  return `/studio-projects/${projectId}/builder`
}
