"use client"

import { useEffect, useState } from "react"

type Draft = {
  id: string
  path: string
  createdAt: number
}

export default function DraftPanel({ projectId }:{ projectId:string }){

  const [drafts,setDrafts] = useState<Draft[]>([])

  async function load(){
    const res = await fetch(
      "/api/ai/drafts?projectId="+projectId,
      { cache:"no-store" }
    )

    const json = await res.json()

    setDrafts(json.drafts || [])
  }

  useEffect(()=>{
    load()
    const id = setInterval(load,1500)
    return ()=>clearInterval(id)
  },[projectId])

  async function accept(id:string){
    await fetch("/api/ai/drafts/accept",{
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({ draftId:id })
    })
    load()
  }

  async function reject(id:string){
    await fetch("/api/ai/drafts/reject",{
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({ draftId:id })
    })
    load()
  }

  return (
    <div style={{borderTop:"1px solid #eee",padding:8}}>
      <div style={{fontWeight:600,marginBottom:6}}>
        Draft Diff Engine
      </div>

      {drafts.length === 0 && (
        <div style={{fontSize:12,color:"#888"}}>
          No drafts
        </div>
      )}

      {drafts.map(d=>(
        <div key={d.id}
          style={{
            border:"1px solid #ddd",
            padding:6,
            marginBottom:6,
            fontSize:12
          }}
        >
          <div>{d.path}</div>

          <div style={{marginTop:4}}>
            <button onClick={()=>accept(d.id)}>Accept</button>
            <button onClick={()=>reject(d.id)} style={{marginLeft:6}}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )

}
