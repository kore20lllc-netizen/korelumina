export async function runDiff(projectId:string, prompt:string){

  const r = await fetch("/api/ai/diff",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ projectId, prompt })
  })

  return await r.json()
}

export async function applyDiff(projectId:string, diff:any){

  await fetch("/api/dev/files/write",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      projectId,
      file: diff.file,
      content: diff.next
    })
  })

}
