"use client"

import { useEffect, useState } from "react"

type Draft = {
  id: string
  path: string
  content: string
  t: number
}

export default function DraftPanel({
  projectId,
  refreshTick,
  onAccepted
}:{
  projectId:string
  refreshTick:number
  onAccepted?:()=>void
}){

  const [drafts,setDrafts] = useState<Draft[]>([])

  async function load(){
    try{
      const r = await fetch(
        "/api/dev/drafts?projectId=" + projectId,
        { cache:"no-store" }
      )
      const j = await r.json()
      setDrafts(Array.isArray(j?.drafts) ? j.drafts : [])
    }catch(e){
      console.error("draft load failed",e)
    }
  }

  async function accept(id:string){

    await fetch("/api/dev/drafts/accept",{
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({
        projectId,
        draftId:id
      })
    })

    await load()

    window.dispatchEvent(
      new Event("kore:builder-refresh")
    )

    onAccepted?.()
  }

  async function reject(id:string){

    await fetch("/api/dev/drafts/reject",{
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({
        projectId,
        draftId:id
      })
    })

    await load()
  }

  useEffect(()=>{
    load()
  },[projectId,refreshTick])

  return (
    <div style={{
      borderTop:"1px solid #eee",
      padding:8,
      height:"100%",
      overflow:"auto"
    }}>
      <div style={{fontWeight:700,marginBottom:8}}>
        Draft Diff Engine ({drafts.length})
      </div>

      {drafts.length === 0 && (
        <div style={{fontSize:12,color:"#888"}}>
          No drafts yet
        </div>
      )}

      {drafts.map(d=>(
        <div key={d.id} style={{
          border:"1px solid #ddd",
          padding:8,
          marginBottom:8,
          fontSize:12
        }}>
          <div style={{fontFamily:"monospace"}}>
            {d.path}
          </div>

          <button onClick={()=>accept(d.id)}>
            Accept
          </button>

          <button
            style={{marginLeft:6}}
            onClick={()=>reject(d.id)}
          >
            Reject
          </button>

        </div>
      ))}

    </div>
  )
}
