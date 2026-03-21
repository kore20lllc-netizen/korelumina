import { getIntentState } from "./state"

export async function resolveWorkspace(projectId: string){

  const intent = await getIntentState(projectId)

  if(!intent){
    return {
      workspace:"dev",
      target:"app"
    }
  }

  const { target, mode } = intent

  // WEBSITE → designer workspace
  if(target === "website" && mode === "designer"){
    return {
      workspace:"designer",
      target:"website"
    }
  }

  // APP → dev workspace
  if(target === "app" && mode === "dev"){
    return {
      workspace:"dev",
      target:"app"
    }
  }

  // fallback
  return {
    workspace:"dev",
    target:"app"
  }
}
