let versions:Record<string,number> = {}

export function bumpVersion(projectId:string){

  if(!versions[projectId]){
    versions[projectId] = 1
  }else{
    versions[projectId]++
  }

  return versions[projectId]

}

export function getVersion(projectId:string){
  return versions[projectId] || 0
}
