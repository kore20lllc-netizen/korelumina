export type BuildType =
  | "website"
  | "app"
  | "saas"

export type UserMode =
  | "ai"
  | "designer"
  | "developer"

export type WorkspaceConfig = {
  buildType: BuildType
  mode: UserMode
}

export function resolveWorkspace(config: WorkspaceConfig){

  const { buildType, mode } = config

  if(buildType === "website"){
    if(mode === "ai") return "workspace-ai-website"
    if(mode === "designer") return "workspace-designer-website"
    return "workspace-dev-website"
  }

  if(buildType === "app"){
    if(mode === "ai") return "workspace-ai-app"
    if(mode === "designer") return "workspace-designer-app"
    return "workspace-dev-app"
  }

  if(buildType === "saas"){
    if(mode === "ai") return "workspace-ai-saas"
    if(mode === "designer") return "workspace-designer-saas"
    return "workspace-dev-saas"
  }

  return "workspace-dev-app"
}
