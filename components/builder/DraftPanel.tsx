"use client"

import { useEffect, useState } from "react"

type Draft = {
  id:string
  path:string
  content:string
  t:number
}

export default function DraftPanel({
  projectId,
  version
}:{ 
  projectId:string
  version:number
}){

  const [drafts,setDrafts] = useState<Draft[]>([])

  async function load(){
    const r = await fetch(
      "/api/dev/drafts?projectId=" + projectId,
      { cache:"no-store" }
    )
    const j = await r.json()
    setDrafts(j.drafts || [])
  }

  useEffect(()=>{
    load()
  },[version])

  async function accept(id:string){
    await fetch(
      "/api/dev/drafts/accept",
      {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({
          projectId,
          draftId:id
        })
      }
    )
  }

  return(
    <div className="p-3 border-b">
      <div className="font-bold mb-2">Drafts</div>

      {drafts.map(d=>(
        <div key={d.id} className="mb-2 text-xs">
          <div>{d.path}</div>

          <button
            className="bg-black text-white px-2 py-1"
            onClick={()=>accept(d.id)}
          >
            Accept
          </button>
        </div>
      ))}
    </div>
  )

}
